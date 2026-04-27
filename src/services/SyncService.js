import { auth, db } from './firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
/**
 * SyncService
 * Bridges the modular Zustand store with the existing Firebase data structure.
 */
class SyncService {
  constructor() {
    this.unsubscribe = null;
    this.isApplyingRemoteChange = false;
    this.saveTimeout = null;
  }

  start(teamId, store) {
    if (this.unsubscribe) this.unsubscribe();
    if (!teamId || !store) return;

    const gameDocRef = doc(db, 'teams', teamId, 'games', 'current');

    console.log(`[Sync] Starting listener for team: ${teamId}`);
    
    this.unsubscribe = onSnapshot(gameDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        console.warn('[Sync] No game data found for this team.');
        return;
      }

      const data = snapshot.data();
      this.isApplyingRemoteChange = true;
      
      try {
        this.hydrateSlices(data, store);
      } finally {
        this.isApplyingRemoteChange = false;
      }
    });
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Maps legacy v1 data to modular v2 slices.
   */
  hydrateSlices(data, store) {
    if (!store) return;
    const isAuswaerts = data.settings?.isAuswaertsspiel || false;

    // 1. Squad Sync
    if (data.roster) {
      const rawRoster = Array.isArray(data.roster) ? data.roster : Object.values(data.roster);
      const roster = rawRoster.map(p => ({
        id: p.id || Math.random().toString(36).substr(2, 9),
        ...p
      }));

      const rawOpponents = Array.isArray(data.knownOpponents) ? data.knownOpponents : Object.values(data.knownOpponents || {});

      store.setSquadData?.({
        home: isAuswaerts ? rawOpponents : roster,
        away: isAuswaerts ? roster : rawOpponents
      });
    }

    // 2. Match Sync
    if (data.score || data.timer || data.gameLog) {
      store.setMatchData?.({
        score: data.score || { heim: 0, gegner: 0 },
        gameLog: data.gameLog || [],
        timer: data.timer || { gamePhase: 1, verstricheneSekundenBisher: 0 },
        isSpielAktiv: data.isSpielAktiv || false,
        activeSuspensions: data.activeSuspensions || []
      });
    }

    // 3. Fines Sync
    if (data.finesCatalog || data.finesHistory) {
      store.setFinesData?.({
        catalog: data.finesCatalog,
        history: data.finesHistory,
        settings: data.finesSettings,
        status: data.finesStatus
      });
    }

    // 4. Calendar Sync (Part of Squad in v2)
    if (data.calendarEvents || data.calendarSubscriptions) {
      const rawEvents = Array.isArray(data.calendarEvents) ? data.calendarEvents : Object.values(data.calendarEvents || {});
      const rawSubs = Array.isArray(data.calendarSubscriptions) ? data.calendarSubscriptions : Object.values(data.calendarSubscriptions || {});
      
      store.setSquadData?.({
        calendarEvents: rawEvents,
        subscriptions: rawSubs,
        hiddenEventIds: data.hiddenEventIds || []
      });
    }

    // 5. Settings Sync
    if (data.settings) {
      store.updateSettings?.({
        ...data.settings,
        homeName: data.settings.teamNameHeim || data.settings.homeName || 'Mein Team',
        awayName: data.settings.teamNameGegner || data.settings.awayName || 'Gegner',
        homeColor: data.settings.homeColor || '#84cc16',
        awayColor: data.settings.awayColor || '#3f3f46'
      });
    }

    // 6. History Sync
    if (data.history) {
      store.setHistory?.(data.history);
    }

    store.setHydrated?.(true);
    console.log('[Sync] Store hydrated from Cloud.');
  }

  /**
   * Debounced save to Firestore.
   * This should be called by the store whenever relevant data changes.
   */
  save(teamId, storeState) {
    if (this.isApplyingRemoteChange || !teamId) return;

    // Clear any existing timeout to restart the debounce timer
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      this.saveTimeout = null; // Reset timeout ref
      
      const gameDocRef = doc(db, 'teams', teamId, 'games', 'current');
      
      // Prepare the payload (merging modular state back to legacy structure)
      const squad = storeState.squad || {};
      const match = storeState.activeMatch || {}; 
      const history = storeState.history || [];
      const fines = storeState.fines || {};

      const payload = {
        roster: squad.home || [], 
        knownOpponents: squad.away || [],
        settings: {
          ...squad.settings,
          teamNameHeim: squad.settings?.homeName || 'Heim',
          teamNameGegner: squad.settings?.awayName || 'Gegner',
          homeColor: squad.settings?.homeColor || '#84cc16',
          awayColor: squad.settings?.awayColor || '#3f3f46'
        },
        mode: match?.mode || null,
        score: { heim: match?.score?.home || 0, gegner: match?.score?.away || 0 },
        gameLog: match?.log || [],
        timer: {
          verstricheneSekundenBisher: (match?.timer?.elapsedMs || 0) / 1000,
          istPausiert: match?.timer?.isPaused ?? true,
          gamePhase: match?.timer?.phase === 'ENDED' || !storeState.activeMatch ? 5 :
                     (match?.timer?.phase === 'HALF_TIME' ? 3 : 
                     (match?.timer?.phase === 'FIRST_HALF' || match?.timer?.phase === 'SECOND_HALF' || match?.timer?.phase === 'LIVE' ? 2 : 1))
        },
        activeSuspensions: match?.suspensions || [],
        finesCatalog: fines.catalog || [],
        finesHistory: fines.history || [],
        finesSettings: fines.settings || {},
        finesStatus: fines.status || {},
        calendarEvents: this.stripFunctions(squad.calendarEvents || []),
        calendarSubscriptions: this.stripFunctions(squad.subscriptions || []),
        hiddenEventIds: squad.hiddenEventIds || [],
        history: this.stripFunctions(history),
        lastUpdated: new Date().toISOString()
      };

      try {
        // 1. Save Game Data (to current game doc)
        console.log('[Sync] Saving Game Data to Cloud:', teamId, payload);
        await updateDoc(gameDocRef, this.stripFunctions(payload));

        // 2. Save Team Settings (to root team doc)
        if (storeState.squad?.settings) {
          const teamDocRef = doc(db, 'teams', teamId);
          console.log('[Sync] Saving Team Settings to Cloud:', teamId, storeState.squad.settings);
          await updateDoc(teamDocRef, this.stripFunctions({
            name: storeState.squad.settings.homeName,
            settings: storeState.squad.settings
          }));
        }

        console.log('[Sync] All data saved to Cloud.');
      } catch (error) {
        console.error('[Sync] Save failed:', error);
      }
    }, 500); // 500ms debounce
  }

  /**
   * Recursively removes functions from an object/array to make it Firestore-safe.
   */
  stripFunctions(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj; // Keep Dates
    
    if (Array.isArray(obj)) {
      return obj
        .map(item => this.stripFunctions(item))
        .filter(item => item !== undefined && typeof item !== 'function');
    }

    const cleaned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        // Remove undefined and functions
        if (value !== undefined && typeof value !== 'function') {
          cleaned[key] = this.stripFunctions(value);
        }
      }
    }
    return cleaned;
  }
}

const syncService = new SyncService();
export default syncService;
