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
  }

  /**
   * Internal helper to manage subscriptions
   */
  _subscribe(key, docRefOrQuery, callback) {
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

      if (teamData.settings) {
        store.updateSettings?.({
          ...teamData.settings,
          homeName: teamData.settings.homeName || teamData.name || 'Mein Team'
        });
      }
      store.setHydrated?.(true);
    });

    this._subscribe(`game_${teamId}`, doc(db, 'teams', teamId, 'games', 'current'), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (this.isMigrating) return;
      this.hydrateSlices(teamId, data, store);
    });

    // SaaS OPTIMIZATION: Fine History as subcollection
    this.subscribeToFines(teamId, store);
  }

  subscribeToFines(teamId, store) {
    if (!teamId || !store) return;
    const q = query(collection(db, 'teams', teamId, 'fines'), orderBy('date', 'desc'), limit(200));
    return this._subscribe(`fines_${teamId}`, q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      store.setFinesHistory?.(history);
    });
  }

  subscribeToEvents(teamId, store) {
    if (!teamId || !store) return;
    const q = query(collection(db, 'teams', teamId, 'events'), orderBy('date', 'asc'), limit(100));
    return this._subscribe(`events_${teamId}`, q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      store.setCalendarEvents?.(events);
    });
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
    });
  }

  subscribeToHistory(teamId, store, limitCount = 20) {
    if (!teamId || !store) return;
    const q = query(collection(db, 'teams', teamId, 'history'), orderBy('date', 'desc'), limit(limitCount));
    return this._subscribe(`history_${teamId}`, q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      store.setHistory?.(history);
    });
  }

  subscribeToMembers(teamId, store) {
    if (!teamId || !store) return;
    const colRef = collection(db, 'teams', teamId, 'members');
    return this._subscribe(`members_${teamId}`, colRef, (snapshot) => {
      const members = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      store.setAllMembers?.(members);
    });
  }

  // =============================================================================
  // HYDRATION
  // =============================================================================

  hydrateSlices(teamId, data, store) {
    if (!store) return;
    

    if (data.score || data.timer || data.gameLog) {
      store.setMatchData?.({
        scoreHome: data.score?.scoreHome || data.score?.home || data.score?.heim || 0,
        scoreAway: data.score?.scoreAway || data.score?.away || data.score?.gegner || 0,
        gameLog: data.gameLog || [],
        timer: {
          isRunning: data.timer?.isRunning ?? false,
          startTime: data.timer?.startTime?.toMillis() || null,
          offsetSeconds: data.timer?.offsetSeconds || 0,
          gamePhase: data.timer?.gamePhase || 1
        },
        activeSuspensions: data.activeSuspensions || []
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

  /**
   * Optimized: Save Match State (Excluding Logs to avoid bloat)
   */
  saveMatch(teamId, matchState) {
    if (this.isApplyingRemoteChange || !teamId) return;
    const docRef = doc(db, 'teams', teamId, 'games', 'current');
    const payload = this._buildMatchPayload(matchState);
    updateDoc(docRef, this.stripFunctions(payload)).catch(e => console.error('[Sync] Match save failed:', e));
  }

  /**
   * ATOMIC SaaS OPTIMIZATION: Combine Log Entry and Match State into ONE write.
   * This reduces Firestore costs and ensures data consistency.
   */
  async recordAction(teamId, entry, matchState = null) {
    if (this.isApplyingRemoteChange || !teamId) return;
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

    try {
      await updateDoc(docRef, this.stripFunctions(updatePayload));
    } catch (e) {
      console.error('[Sync] Atomic recordAction failed:', e);
    }
  }

  /**
   * Internal helper to build the match state payload
   */
  _buildMatchPayload(matchState) {
    return {
      score: { 
        heim: matchState.score?.home || 0, 
        gegner: matchState.score?.away || 0 
      },
      timer: {
        isRunning: !matchState.timer?.isPaused,
        startTime: !matchState.timer?.isPaused ? serverTimestamp() : null,
        offsetSeconds: (matchState.timer?.elapsedMs || 0) / 1000,
        gamePhase: matchState.timer?.phase === 'ENDED' ? 5 :
                   (matchState.timer?.phase === 'HALF_TIME' ? 3 : 
                   (matchState.timer?.phase === 'PRE_GAME' ? 1 : 2))
      },
      activeSuspensions: matchState.suspensions || [],
      lastUpdated: serverTimestamp()
    };
  }

  async saveSettings(teamId, settings) {
    if (this.isApplyingRemoteChange || !teamId || !settings) return;
    const teamRef = doc(db, 'teams', teamId);
    const update = { name: settings.homeName, settings: this.stripFunctions(settings) };
    try {
      await updateDoc(teamRef, update);
    } catch (e) { console.error('[Sync] Settings save failed:', e); }
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
    const gameRef = doc(db, 'teams', String(teamId), 'games', 'current');
    const payload = {
      finesCatalog: fines.catalog || [],
      finesSettings: fines.settings || {},
      finesStatus: fines.status || {}
    };
    updateDoc(gameRef, this.stripFunctions(payload)).catch(e => console.error('[Sync] Fines save failed:', e));
  }

  /**
   * SaaS OPTIMIZATION: Granular Fine Entry Save
   */
  async saveFineEntry(teamId, fine) {
    if (this.isApplyingRemoteChange || !teamId || !fine.id) return;
    const fineRef = doc(db, 'teams', String(teamId), 'fines', String(fine.id));
    setDoc(fineRef, this.stripFunctions(fine), { merge: true }).catch(e => console.error('[Sync] Fine entry save failed:', e));
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
   async saveHistoryGame(teamId, game) {
    if (this.isApplyingRemoteChange || !teamId) return;
    const gameId = String(game.id || `h_${Date.now()}`);
    
    // 1. Metadata (Light version for list views)
    // Exclude heavy tactical data: gameLog, lineup, and playingTime
    const { gameLog, lineup, playingTime, ...metadata } = game;
    const historyRef = doc(db, 'teams', String(teamId), 'history', gameId);
    await setDoc(historyRef, this.stripFunctions(metadata), { merge: true });

    // 2. Details (Full tactical data)
    if (gameLog || lineup || playingTime) {
      const detailsRef = doc(db, 'teams', String(teamId), 'history', gameId, 'details', 'tactical');
      await setDoc(detailsRef, this.stripFunctions({ 
        gameLog: gameLog || [], 
        lineup: lineup || { home: [], away: [] },
        playingTime: playingTime || {} 
      }), { merge: true });
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
