import { create } from 'zustand';

// Slices
import { createRosterSlice, initialRosterState } from './slices/rosterSlice';
import { createCalendarSlice, initialCalendarState } from './slices/calendarSlice';
import { createSettingsSlice, initialSettingsState } from './slices/settingsSlice';
import { createActiveMatchSlice, initialActiveMatchState } from './slices/activeMatchSlice';
import { createHistorySlice, initialHistoryState } from './slices/historySlice';
import { createFineSlice, initialFineState } from './slices/fineSlice';
import { createSocialSlice, initialSocialState } from './slices/socialSlice';
import { createTacticsSlice, initialTacticsState } from './slices/tacticsSlice';
import { createAuthSlice, initialAuthState } from './slices/authSlice';
import syncService from '../services/SyncService';

/**
 * Sechsmeter Central Store
 * Modularized for SaaS Scalability.
 */
/**
 * Sechsmeter Central Store
 * Modularized for SaaS Scalability.
 * Persistence disabled for maximum security in SaaS environment.
 */
const useStore = create((set, get, ...args) => ({
  ...createRosterSlice(set, get, ...args),
  ...createCalendarSlice(set, get, ...args),
  ...createSettingsSlice(set, get, ...args),
  ...createActiveMatchSlice(set, get, ...args),
  ...createHistorySlice(set, get, ...args),
  ...createFineSlice(set, get, ...args),
  ...createSocialSlice(set, get, ...args),
  ...createTacticsSlice(set, get, ...args),
  ...createAuthSlice(set, get, ...args),

  // Global Utils
  resetAll: async () => {
    const { activeTeamId, isAuthenticated } = get();
    
    // If we have an active team, we should also wipe the cloud data for this team
    if (isAuthenticated && activeTeamId) {
      console.log('[Store] Starting resetAll for team:', activeTeamId);
      try {
        const { doc, setDoc, deleteDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        const gameDocRef = doc(db, 'teams', activeTeamId, 'games', 'current');
        const memberRef = doc(db, 'teams', activeTeamId, 'members', get().user?.uid);
        
        console.log('[Store] Wiping game document and member record...');
        
        // Use Promise.all to ensure both cloud operations finish
        await Promise.all([
          setDoc(gameDocRef, {
            roster: [],
            score: { heim: 0, gegner: 0 },
            gameLog: [],
            lastUpdated: serverTimestamp(),
            wipedAt: serverTimestamp()
          }),
          deleteDoc(memberRef)
        ]);
        
        console.log('[Store] Cloud data and member record wiped successfully.');
      } catch (e) {
        console.error('[Store] Failed to wipe cloud data:', e);
      }
    }

    console.log('[Store] Resetting local slices...');
    // Reset all slices to initial state
    set({
      ...initialRosterState,
      ...initialCalendarState,
      ...initialSettingsState,
      ...initialActiveMatchState,
      ...initialHistoryState,
      ...initialFineState,
      ...initialSocialState,
      ...initialTacticsState,
      activeMember: null,
      allMembers: [] 
    });
    console.log('[Store] Local state reset complete.');
  }
}));

export default useStore;
