import { auth, db } from './firebase';
import { 
  doc, onSnapshot, updateDoc, getDoc, collection, 
  setDoc, deleteDoc, writeBatch, query, limit 
} from 'firebase/firestore';

/**
 * SyncService V2 (SaaS Scale)
 * Handles granular updates via subcollections for Events, Roster, and History.
 */
class SyncService {
  constructor() {
    this.unsubscribe = [];
    this.isApplyingRemoteChange = false;
    this.saveTimeout = null;
  }

  start(teamId, store) {
    this.stop(); // Ensure clean start
    if (!teamId || !store) return;

    const gameDocRef = doc(db, 'teams', teamId, 'games', 'current');
    const teamDocRef = doc(db, 'teams', teamId);
    const historyColRef = collection(db, 'teams', teamId, 'history');
    const eventsColRef = collection(db, 'teams', teamId, 'events');
    const rosterColRef = collection(db, 'teams', teamId, 'roster');

    console.log(`[Sync] Starting High-Scale listeners for team: ${teamId}`);
    
    // 1. Core Game Listener (Live Match)
    const unsubGame = onSnapshot(gameDocRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      this.isApplyingRemoteChange = true;
      try {
        this.hydrateSlices(data, store);
        
        // Migration: History
        if (data.history && Array.isArray(data.history) && data.history.length > 0) {
          this.migrateHistoryToCollection(teamId, data.history);
        }
        // Migration: Events
        if (data.calendarEvents && Array.isArray(data.calendarEvents) && data.calendarEvents.length > 0) {
          this.migrateEventsToCollection(teamId, data.calendarEvents);
        }
        // Migration: Roster
        if (data.roster && Array.isArray(data.roster) && data.roster.length > 0) {
          this.migrateRosterToCollection(teamId, data.roster, 'home');
        }
        if (data.knownOpponents && Array.isArray(data.knownOpponents) && data.knownOpponents.length > 0) {
          this.migrateRosterToCollection(teamId, data.knownOpponents, 'away');
        }
      } finally {
        this.isApplyingRemoteChange = false;
      }
    });

    // 2. Team Settings Listener
    const unsubTeam = onSnapshot(teamDocRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const teamData = snapshot.data();
      store.setSquadData?.({
        ownerUid: teamData.ownerUid,
        name: teamData.name
      });
      if (teamData.settings) {
        store.updateSettings?.({
          ...teamData.settings,
          homeName: teamData.settings.homeName || teamData.name || 'Mein Team'
        });
      }
    });

    // 3. History Listener
    const unsubHistory = onSnapshot(historyColRef, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      store.setHistory?.(history);
    });

    // 4. Events Listener (Calendar)
    const unsubEvents = onSnapshot(eventsColRef, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      store.setCalendarEvents?.(events);
    });

    // 5. Roster Listener
    const unsubRoster = onSnapshot(rosterColRef, (snapshot) => {
      const allPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const home = allPlayers.filter(p => p.teamType === 'home' || !p.teamType);
      const away = allPlayers.filter(p => p.teamType === 'away');
      store.setSquadData?.({ home, away });
    });

    this.unsubscribe = [unsubGame, unsubTeam, unsubHistory, unsubEvents, unsubRoster];
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe.forEach(u => u());
      this.unsubscribe = [];
    }
  }

  hydrateSlices(data, store) {
    if (!store) return;
    
    // Match Sync (Live Ticker)
    if (data.score || data.timer || data.gameLog) {
      store.setMatchData?.({
        scoreHome: data.score?.scoreHome || data.score?.home || data.score?.heim || 0,
        scoreAway: data.score?.scoreAway || data.score?.away || data.score?.gegner || 0,
        score: data.score || { heim: 0, gegner: 0 },
        gameLog: data.gameLog || [],
        timer: data.timer || { gamePhase: 1, verstricheneSekundenBisher: 0 },
        isSpielAktiv: data.isSpielAktiv || false,
        activeSuspensions: data.activeSuspensions || []
      });
    }

    // Fines Sync
    if (data.finesCatalog || data.finesHistory) {
      store.setFinesData?.({
        catalog: data.finesCatalog,
        history: data.finesHistory,
        settings: data.finesSettings,
        status: data.finesStatus
      });
    }

    // Subscriptions & Hidden IDs (still in core doc for simplicity)
    if (data.calendarSubscriptions || data.hiddenEventIds) {
      store.setSquadData?.({
        subscriptions: data.calendarSubscriptions || [],
        hiddenEventIds: data.hiddenEventIds || []
      });
    }

    store.setHydrated?.(true);
  }

  /**
   * Save Granular: Live Game
   */
  saveMatch(teamId, matchState) {
    if (this.isApplyingRemoteChange || !teamId) return;
    const docRef = doc(db, 'teams', teamId, 'games', 'current');
    
    const payload = {
      scoreHome: matchState.score?.home || 0,
      scoreAway: matchState.score?.away || 0,
      // Legacy Score support
      score: { heim: matchState.score?.home || 0, gegner: matchState.score?.away || 0 },
      gameLog: matchState.log || [],
      timer: {
        verstricheneSekundenBisher: (matchState.timer?.elapsedMs || 0) / 1000,
        istPausiert: matchState.timer?.isPaused ?? true,
        gamePhase: matchState.timer?.phase === 'ENDED' ? 5 :
                   (matchState.timer?.phase === 'HALF_TIME' ? 3 : 2)
      },
      activeSuspensions: matchState.suspensions || [],
      lastUpdated: new Date().toISOString()
    };

    updateDoc(docRef, this.stripFunctions(payload)).catch(e => console.error('[Sync] Match save failed:', e));
  }

  /**
   * Save Granular: Settings
   */
  async saveSettings(teamId, settings) {
    if (!teamId || !settings) return;
    const teamRef = doc(db, 'teams', teamId);
    const gameRef = doc(db, 'teams', teamId, 'games', 'current');

    const update = {
      name: settings.homeName,
      settings: this.stripFunctions(settings)
    };

    try {
      await updateDoc(teamRef, update);
      // Legacy support: also update settings in current doc
      await updateDoc(gameRef, { settings: update.settings });
    } catch (e) {
      console.error('[Sync] Settings save failed:', e);
    }
  }

  /**
   * Save Granular: Fines
   */
  async saveFines(teamId, fines) {
    if (!teamId || !fines) return;
    const gameRef = doc(db, 'teams', teamId, 'games', 'current');
    const payload = {
      finesCatalog: fines.catalog || [],
      finesHistory: fines.history || [],
      finesSettings: fines.settings || {},
      finesStatus: fines.status || {}
    };
    updateDoc(gameRef, this.stripFunctions(payload)).catch(e => console.error('[Sync] Fines save failed:', e));
  }

  /**
   * History Docs
   */
  async saveHistoryGame(teamId, game) {
    const docRef = doc(db, 'teams', teamId, 'history', game.id || `h_${Date.now()}`);
    setDoc(docRef, this.stripFunctions(game), { merge: true });
  }

  async deleteHistoryGame(teamId, gameId) {
    deleteDoc(doc(db, 'teams', teamId, 'history', gameId));
  }

  /**
   * Event Docs (Calendar)
   */
  async saveEvent(teamId, event) {
    if (!teamId || !event.id) return;
    const docRef = doc(db, 'teams', teamId, 'events', event.id);
    setDoc(docRef, this.stripFunctions(event), { merge: true });
  }

  async deleteEvent(teamId, eventId) {
    if (!teamId || !eventId) return;
    deleteDoc(doc(db, 'teams', teamId, 'events', eventId));
  }

  /**
   * Roster Docs (Players)
   */
  async savePlayer(teamId, player, teamType = 'home') {
    if (!teamId || !player.id) return;
    const docRef = doc(db, 'teams', teamId, 'roster', player.id);
    setDoc(docRef, this.stripFunctions({ ...player, teamType }), { merge: true });
  }

  async deletePlayer(teamId, playerId) {
    if (!teamId || !playerId) return;
    deleteDoc(doc(db, 'teams', teamId, 'roster', playerId));
  }

  /**
   * MIGRATIONS
   */
  async migrateHistoryToCollection(teamId, legacyHistory) {
    const batch = writeBatch(db);
    legacyHistory.forEach(g => batch.set(doc(db, 'teams', teamId, 'history', g.id || `h_${Math.random()}`), this.stripFunctions(g)));
    batch.update(doc(db, 'teams', teamId, 'games', 'current'), { history: null });
    await batch.commit();
  }

  async migrateEventsToCollection(teamId, legacyEvents) {
    console.log(`[Migration] Moving ${legacyEvents.length} events to subcollection...`);
    const batch = writeBatch(db);
    legacyEvents.forEach(e => {
      const id = e.id || `e_${Math.random().toString(36).substr(2, 9)}`;
      batch.set(doc(db, 'teams', teamId, 'events', id), this.stripFunctions({ ...e, id }));
    });
    batch.update(doc(db, 'teams', teamId, 'games', 'current'), { calendarEvents: null });
    await batch.commit();
  }

  async migrateRosterToCollection(teamId, legacyRoster, teamType) {
    console.log(`[Migration] Moving ${legacyRoster.length} ${teamType} players to subcollection...`);
    const batch = writeBatch(db);
    legacyRoster.forEach(p => {
      const id = p.id || `p_${Math.random().toString(36).substr(2, 9)}`;
      batch.set(doc(db, 'teams', teamId, 'roster', id), this.stripFunctions({ ...p, id, teamType }));
    });
    const field = teamType === 'home' ? 'roster' : 'knownOpponents';
    batch.update(doc(db, 'teams', teamId, 'games', 'current'), { [field]: null });
    await batch.commit();
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
