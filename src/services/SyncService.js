import { auth, db } from './firebase';
import { 
  doc, onSnapshot, updateDoc, getDoc, collection, 
  setDoc, deleteDoc, writeBatch, query, limit, orderBy, where,
  serverTimestamp, arrayUnion
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

    this._subscribe(`team_${teamId}`, doc(db, 'teams', teamId), (snapshot) => {
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
      this.hydrateSlices(data, store);
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

  hydrateSlices(data, store) {
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

    if (data.finesCatalog || data.finesHistory) {
      store.setFinesData?.({
        catalog: data.finesCatalog,
        history: data.finesHistory,
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
    
    const payload = {
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

    updateDoc(docRef, this.stripFunctions(payload)).catch(e => console.error('[Sync] Match save failed:', e));
  }

  async saveSettings(teamId, settings) {
    if (this.isApplyingRemoteChange || !teamId || !settings) return;
    const teamRef = doc(db, 'teams', teamId);
    const gameRef = doc(db, 'teams', teamId, 'games', 'current');
    const update = { name: settings.homeName, settings: this.stripFunctions(settings) };
    try {
      await updateDoc(teamRef, update);
      await updateDoc(gameRef, { settings: update.settings });
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
      finesHistory: fines.history || [],
      finesSettings: fines.settings || {},
      finesStatus: fines.status || {}
    };
    updateDoc(gameRef, this.stripFunctions(payload)).catch(e => console.error('[Sync] Fines save failed:', e));
  }

  async saveHistoryGame(teamId, game) {
    if (this.isApplyingRemoteChange || !teamId) return;
    const gameId = String(game.id || `h_${Date.now()}`);
    setDoc(doc(db, 'teams', String(teamId), 'history', gameId), this.stripFunctions(game), { merge: true });
  }

  async deleteHistoryGame(teamId, gameId) {
    deleteDoc(doc(db, 'teams', String(teamId), 'history', String(gameId)));
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
