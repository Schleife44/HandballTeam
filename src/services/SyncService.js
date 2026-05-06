import { auth, db } from './firebase';
import { 
  doc, onSnapshot, updateDoc, getDoc, collection, 
  setDoc, deleteDoc, writeBatch, query, limit, orderBy, where,
  serverTimestamp, arrayUnion, deleteField
} from 'firebase/firestore';

/**
 * SyncService V2.2 (SaaS Optimized)
 * Handles granular updates via subcollections.
 * Implements arrayUnion for Logs and Server-side Timer Interpolation.
 */
class SyncService {
  constructor() {
    this.subscriptions = new Map();
    this.isApplyingRemoteChange = false;
    this.isMigrating = false;
    
    // Rate Limiting & Debugging
    this.writeHistory = [];
    this.lastWriteTime = 0;
    this.writesInLastSecond = 0;
  }

  _checkRateLimit(methodName) {
    const now = Date.now();
    if (now - this.lastWriteTime < 1000) {
      this.writesInLastSecond++;
    } else {
      this.writesInLastSecond = 1;
      this.lastWriteTime = now;
    }

    if (this.writesInLastSecond > 8) {
      console.error(`[Sync] ⚠️ RATE LIMIT HIT! Blocking write from ${methodName}. Check for infinite loops!`);
      return false;
    }

    // Verbose Logging for Debugging
    console.group(`[Sync] 📤 WRITE: ${methodName}`);
    console.log('Timestamp:', new Date().toLocaleTimeString());
    this.writeHistory.push({ method: methodName, time: now });
    if (this.writeHistory.length > 50) this.writeHistory.shift();
    
    return true;
  }

  /**
   * Internal helper to manage subscriptions
   */
  _subscribe(key, docRefOrQuery, callback, store) {
    if (this.subscriptions.has(key)) return this.subscriptions.get(key);

    console.log(`[Sync] 🛰️ Subscribing to: ${key}`);
    const unsub = onSnapshot(docRefOrQuery, (snapshot) => {
      this.isApplyingRemoteChange = true;
      try {
        callback(snapshot);
      } finally {
        this.isApplyingRemoteChange = false;
      }
    }, (err) => {
      console.error(`[Sync] Subscription error for ${key}:`, err);
      if (err.code === 'quota-exceeded' || err.message?.includes('quota')) {
        store?.setSyncStatus?.('quota_exceeded');
      } else {
        store?.setSyncStatus?.('offline');
      }
    });

    this.subscriptions.set(key, unsub);
    return unsub;
  }

  unsubscribe(key) {
    if (this.subscriptions.has(key)) {
      console.log(`[Sync] 🛑 Unsubscribing from: ${key}`);
      this.subscriptions.get(key)();
      this.subscriptions.delete(key);
    }
  }

  stop() {
    this.subscriptions.forEach((unsub, key) => {
      console.log(`[Sync] 🛑 Stopping: ${key}`);
      unsub();
    });
    this.subscriptions.clear();
  }

  // =============================================================================
  // GRANULAR SUBSCRIPTIONS
  // =============================================================================

  subscribeToCore(teamId, store) {
    if (!teamId || !store) return;

    // SaaS Resilienz: Falls die Quota voll ist, soll die App nicht ewig hängen
    const hydrationTimeout = setTimeout(() => {
      console.warn('[Sync] Hydration timeout reached (likely Quota Exceeded). Forcing hydration...');
      store.setHydrated?.(true);
      store.setRosterHydrated?.(true);
    }, 4000);

    this._subscribe(`team_${teamId}`, doc(db, 'teams', teamId), (snapshot) => {
      clearTimeout(hydrationTimeout);
      if (!snapshot.exists()) {
        store.setHydrated?.(true);
        return;
      }
      const teamData = snapshot.data();
      store.setSquadData?.({
        ownerUid: teamData.ownerUid,
        name: teamData.name,
        contextId: teamId
      });
      
      if (teamData.subscriptionTier || teamData.subscriptionStatus) {
        store.setSubscription?.({
          tier: teamData.subscriptionTier || 'starter',
          status: teamData.subscriptionStatus || 'active',
          expiresAt: teamData.subscriptionExpiresAt || null
        });
      }

      // SaaS FIX: Do not trigger store.updateSettings from here. 
      // It causes a write-loop because updateSettings calls syncService.saveSettings.
      // Settings are already part of the team snapshot and can be accessed via squad.settings.
      if (teamData.settings) {
        // Just set the data in store WITHOUT triggering a cloud save
        store.setSettingsData?.({
          ...teamData.settings,
          homeName: teamData.settings.homeName || teamData.name || 'Mein Team'
        });
      }
      store.setHydrated?.(true);
    }, store);

    this._subscribe(`game_${teamId}`, doc(db, 'teams', teamId, 'games', 'current'), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (this.isMigrating) return;
      this.hydrateSlices(teamId, data, store);
    }, store);

    // SaaS OPTIMIZATION: Fine History as subcollection
    this.subscribeToFines(teamId, store);
    
    // Roster must be loaded globally for AuthGuard identity check
    this.subscribeToRoster(teamId, store);

    // Dashboard Data
    this.subscribeToEvents(teamId, store);
    this.subscribeToHistory(teamId, store);
  }

  subscribeToFines(teamId, store) {
    if (!teamId || !store) return;
    const q = query(collection(db, 'teams', teamId, 'fines'), orderBy('date', 'desc'), limit(200));
    return this._subscribe(`fines_${teamId}`, q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      store.setFinesHistory?.(history);
    }, store);
  }

  subscribeToEvents(teamId, store) {
    if (!teamId || !store) return;
    const q = query(collection(db, 'teams', teamId, 'events'), orderBy('date', 'asc'), limit(100));
    return this._subscribe(`events_${teamId}`, q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      store.setCalendarEvents?.(events);
    }, store);
  }

  subscribeToRoster(teamId, store) {
    if (!teamId || !store) return;
    const colRef = collection(db, 'teams', teamId, 'roster');
    return this._subscribe(`roster_${teamId}`, colRef, (snapshot) => {
      const allPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const home = allPlayers.filter(p => p.teamType === 'home' || !p.teamType);
      const away = allPlayers.filter(p => p.teamType === 'away');
      store.setSquadData?.({ home, away });
      store.setRosterHydrated?.(true);
    }, store);
  }

  subscribeToHistory(teamId, store, limitCount = 20) {
    if (!teamId || !store) return;
    const q = query(collection(db, 'teams', teamId, 'history'), orderBy('date', 'desc'), limit(limitCount));
    return this._subscribe(`history_${teamId}`, q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      store.setHistory?.(history);
    }, store);
  }

  subscribeToMembers(teamId, store) {
    if (!teamId || !store) return;
    const colRef = collection(db, 'teams', teamId, 'members');
    return this._subscribe(`members_${teamId}`, colRef, (snapshot) => {
      const members = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      store.setAllMembers?.(members);
    }, store);
  }

  // =============================================================================
  // HYDRATION
  // =============================================================================

  hydrateSlices(teamId, data, store) {
    if (!store) return;
    

    if (data.score || data.timer || data.gameLog) {
      const ts = data.timer?.startTime;
      let parsedStartTime = null;
      if (ts) {
        if (typeof ts.toMillis === 'function') parsedStartTime = ts.toMillis();
        else if (typeof ts === 'number') parsedStartTime = ts;
        else if (ts.seconds) parsedStartTime = ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000;
        else if (ts instanceof Date) parsedStartTime = ts.getTime();
        else if (typeof ts === 'string') parsedStartTime = new Date(ts).getTime();
      }

      store.setMatchData?.({
        score: {
          home: data.score?.scoreHome || data.score?.home || data.score?.heim || 0,
          away: data.score?.scoreAway || data.score?.away || data.score?.gegner || 0,
        },
        gameLog: Array.isArray(data.gameLog) ? [...data.gameLog].sort((a, b) => {
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tB - tA; // Newest first
        }) : [],
        timer: {
          isRunning: data.timer?.isRunning ?? false,
          startTime: parsedStartTime,
          elapsedMs: (data.timer?.offsetSeconds || data.timer?.elapsedMs / 1000 || 0) * 1000,
          phase: this._getPhaseString(data.timer?.gamePhase || data.timer?.phase || 1, (data.timer?.offsetSeconds || data.timer?.elapsedMs / 1000 || 0) * 1000)
        },
        suspensions: data.activeSuspensions || data.suspensions || [],
        mode: data.mode || 'SIMPLE',
        isEmptyGoal: data.isEmptyGoal ?? false
      });
    }

    if (data.finesCatalog || data.finesSettings) {
      store.setFinesData?.({
        catalog: data.finesCatalog,
        // history: data.finesHistory, // Legacy fallback removed for SaaS-Ready
        settings: data.finesSettings,
        status: data.finesStatus
      });
    }

    if (data.calendarSubscriptions || data.hiddenEventIds) {
      store.setSquadData?.({
        subscriptions: data.calendarSubscriptions || [],
        hiddenEventIds: data.hiddenEventIds || []
      });
    }

    store.setHydrated?.(true);
  }

  // =============================================================================
  // SAVE METHODS
  // =============================================================================

  /**
   * Optimized: Save Log Entry via arrayUnion (Reduces bandwidth and costs)
   */
  async addMatchLogEntry(teamId, entry) {
    if (this.isApplyingRemoteChange || !teamId) return;
    const docRef = doc(db, 'teams', teamId, 'games', 'current');
    
    // Ensure every entry has a unique ID for arrayUnion to work reliably
    const uniqueEntry = {
      ...entry,
      id: entry.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };

    try {
      await updateDoc(docRef, {
        gameLog: arrayUnion(this.stripFunctions(uniqueEntry)),
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.error('[Sync] Log entry save failed:', e);
    }
  }

  async deleteCurrentMatch(teamId) {
    if (!teamId) return;
    try {
      const docRef = doc(db, 'teams', teamId, 'games', 'current');
      await deleteDoc(docRef);
      console.log('[Sync] Current match cleared.');
    } catch (e) {
      console.error('[Sync] Failed to clear current match:', e);
    }
  }

  /**
   * Optimized: Save Match State (Excluding Logs to avoid bloat)
   */
  async saveMatch(teamId, matchState) {
    if (this.isApplyingRemoteChange || !teamId) return;
    if (!this._checkRateLimit('saveMatch')) return;

    try {
      console.group('Sync: saveMatch');
      const docRef = doc(db, 'teams', teamId, 'games', 'current');
      const payload = this._buildMatchPayload(matchState);
      await setDoc(docRef, this.stripFunctions(payload), { merge: true });
      console.log('Payload:', payload);
    } catch (e) {
      console.error('Failed:', e);
    } finally {
      console.groupEnd();
    }
  }

  /**
   * ATOMIC SaaS OPTIMIZATION: Combine Log Entry and Match State into ONE write.
   * This reduces Firestore costs and ensures data consistency.
   */
  async recordAction(teamId, entry, matchState = null) {
    if (this.isApplyingRemoteChange || !teamId) return;
    if (!this._checkRateLimit('recordAction')) return;

    try {
      console.group('Sync: recordAction');
      const docRef = doc(db, 'teams', teamId, 'games', 'current');
      
      const uniqueEntry = {
        ...entry,
        id: entry.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      };

      const updatePayload = {
        gameLog: arrayUnion(this.stripFunctions(uniqueEntry)),
        lastUpdated: serverTimestamp()
      };


      // If matchState is provided, merge it into the same update call
      if (matchState) {
        const matchPayload = this._buildMatchPayload(matchState);
        Object.assign(updatePayload, matchPayload);
      }

      await setDoc(docRef, this.stripFunctions(updatePayload), { merge: true });
      console.log('Entry:', uniqueEntry);
    } catch (e) {
      console.error('Failed:', e);
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Internal helper to build the match state payload
   */
  _buildMatchPayload(matchState) {
    // CRITICAL BUG FIX: Only set startTime if it's missing or if the timer just started.
    // If it's already running, we MUST preserve the existing Firestore startTime.
    const isRunning = !matchState.timer?.isPaused;
    
    const payload = {
      score: {
        heim: matchState.score?.home || 0,
        gegner: matchState.score?.away || 0
      },
      timer: {
        isRunning: isRunning,
        phase: this._getPhaseNumber(matchState.timer?.phase || 'PRE_GAME')
      },
      isEmptyGoal: !!matchState.isEmptyGoal,
      mode: matchState.mode || 'SIMPLE',
      activeSuspensions: matchState.suspensions || [],
      lastUpdated: serverTimestamp()
    };

    // Only touch startTime if we are changing state or it's missing
    if (isRunning && !matchState.timer?.startTime) {
      payload.timer.startTime = serverTimestamp();
      payload.timer.offsetSeconds = (matchState.timer?.elapsedMs || 0) / 1000;
    } else if (!isRunning) {
      payload.timer.startTime = null;
      payload.timer.offsetSeconds = (matchState.timer?.elapsedMs || 0) / 1000;
    }

    return payload;
  }

  _getPhaseNumber(phase) {
    const map = { 'ENDED': 5, 'HALF_TIME': 3, 'PRE_GAME': 1, 'FIRST_HALF': 2, 'SECOND_HALF': 2 };
    return map[phase] || 2;
  }

  _getPhaseString(phaseNum, elapsedMs = 0) {
    const map = { 5: 'ENDED', 3: 'HALF_TIME', 1: 'PRE_GAME' };
    if (phaseNum === 2) {
      return (elapsedMs / 1000) < 1800 ? 'FIRST_HALF' : 'SECOND_HALF';
    }
    return map[phaseNum] || 'FIRST_HALF';
  }

  async saveSettings(teamId, settings) {
    if (this.isApplyingRemoteChange || !teamId || !settings) return;
    if (!this._checkRateLimit('saveSettings')) return;

    try {
      console.group('Sync: saveSettings');
      const teamRef = doc(db, 'teams', teamId);
      
      const update = { 
        name: settings.homeName, 
        settings: this.stripFunctions(settings) 
      };
      
      await updateDoc(teamRef, update);
      console.log('Success');
    } catch (e) {
      console.error('Failed:', e);
    } finally {
      console.groupEnd();
    }
  }

  async saveHiddenEventIds(teamId, hiddenIds) {
    if (this.isApplyingRemoteChange || !teamId) return;
    updateDoc(doc(db, 'teams', teamId), { hiddenEventIds: hiddenIds }).catch(e => console.error('[Sync] Hidden IDs save failed:', e));
  }

  async saveSubscriptions(teamId, subscriptions) {
    if (this.isApplyingRemoteChange || !teamId) return;
    updateDoc(doc(db, 'teams', teamId), { calendarSubscriptions: this.stripFunctions(subscriptions) }).catch(e => console.error('[Sync] Subscriptions save failed:', e));
  }

  async saveFines(teamId, fines) {
    if (this.isApplyingRemoteChange || !teamId || !fines) return;
    if (!this._checkRateLimit('saveFines')) return;

    try {
      console.group('Sync: saveFines');
      const docRef = doc(db, 'teams', teamId);
      await updateDoc(docRef, { fines: this.stripFunctions(fines) });
      console.log('Success');
    } catch (e) {
      console.error('Failed:', e);
    } finally {
      console.groupEnd();
    }
  }

  /**
   * SaaS OPTIMIZATION: Granular Fine Entry Save
   */
  async saveFineEntry(teamId, fine) {
    if (this.isApplyingRemoteChange || !teamId || !fine.id) return;
    if (!this._checkRateLimit('saveFineEntry')) return;

    try {
      console.group('Sync: saveFineEntry');
      const docRef = doc(db, 'teams', teamId, 'fines', fine.id);
      await setDoc(docRef, this.stripFunctions(fine));
      console.log('Success');
    } catch (e) {
      console.error('Failed:', e);
    } finally {
      console.groupEnd();
    }
  }

  /**
   * SaaS OPTIMIZATION: Granular Fine Entry Delete
   */
  async deleteFineEntry(teamId, fineId) {
    if (!teamId || !fineId) return;
    const fineRef = doc(db, 'teams', String(teamId), 'fines', String(fineId));
    deleteDoc(fineRef).catch(e => console.error('[Sync] Fine entry delete failed:', e));
  }

  /**
   * SaaS OPTIMIZATION: Two-Tier Archive
   * Saves metadata to 'history' and full log to 'history_details'
   */
   async saveHistoryGame(teamId, gameData) {
    if (this.isApplyingRemoteChange || !teamId) return;
    if (!this._checkRateLimit('saveHistoryGame')) return;

    try {
      console.group('Sync: saveHistoryGame');
      const docRef = doc(db, 'teams', teamId, 'history', gameData.id);
      await setDoc(docRef, this.stripFunctions(gameData));
      console.log('Success');
    } catch (e) {
      console.error('Failed:', e);
    } finally {
      console.groupEnd();
    }
  }

  /**
   * SaaS OPTIMIZATION: On-demand loading of tactical details
   */
  async fetchHistoryDetails(teamId, gameId) {
    if (!teamId || !gameId) return null;
    try {
      const detailsRef = doc(db, 'teams', String(teamId), 'history', String(gameId), 'details', 'tactical');
      const snap = await getDoc(detailsRef);
      if (snap.exists()) return snap.data();
    } catch (e) {
      console.error('[Sync] Failed to fetch history details:', e);
    }
    return null;
  }

  async deleteHistoryGame(teamId, gameId) {
    if (!teamId || !gameId) return;
    const gameIdStr = String(gameId);
    
    // Delete main record
    await deleteDoc(doc(db, 'teams', String(teamId), 'history', gameIdStr));
    
    // Attempt to delete details (won't error if it doesn't exist)
    await deleteDoc(doc(db, 'teams', String(teamId), 'history', gameIdStr, 'details', 'tactical'));
  }

  async saveEvent(teamId, event) {
    if (this.isApplyingRemoteChange || !teamId || !event.id) return;
    setDoc(doc(db, 'teams', String(teamId), 'events', String(event.id)), this.stripFunctions(event), { merge: true });
  }

  async saveBulkEvents(teamId, events) {
    if (this.isApplyingRemoteChange || !teamId || !Array.isArray(events) || events.length === 0) return;
    const batch = writeBatch(db);
    events.forEach(event => {
      if (!event.id) return;
      batch.set(doc(db, 'teams', String(teamId), 'events', String(event.id)), this.stripFunctions(event), { merge: true });
    });
    await batch.commit().catch(e => console.error('[Sync] Bulk save failed:', e));
  }

  async deleteEvent(teamId, eventId) {
    if (!teamId || !eventId) return;
    deleteDoc(doc(db, 'teams', String(teamId), 'events', String(eventId)));
  }

  async savePlayer(teamId, player, teamType = 'home') {
    if (this.isApplyingRemoteChange || !teamId || !player.id) return;
    setDoc(doc(db, 'teams', String(teamId), 'roster', String(player.id)), this.stripFunctions({ ...player, teamType }), { merge: true });
  }

  async deletePlayer(teamId, playerId) {
    if (!teamId || !playerId) return;
    deleteDoc(doc(db, 'teams', String(teamId), 'roster', String(playerId)));
  }

  stripFunctions(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;
    // Skip Firestore FieldValues and Timestamps (they have an isEqual method in v9)
    if (typeof obj.isEqual === 'function') return obj;
    if (typeof obj.toMillis === 'function') return obj;
    
    if (Array.isArray(obj)) return obj.map(item => this.stripFunctions(item)).filter(item => item !== undefined && typeof item !== 'function');
    const cleaned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value !== undefined && typeof value !== 'function') cleaned[key] = this.stripFunctions(value);
      }
    }
    return cleaned;
  }
}

const syncService = new SyncService();
export default syncService;
