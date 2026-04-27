import { create } from 'zustand';

// Slices
import { createSquadSlice, initialSquadState } from './slices/squadSlice';
import { createMatchSlice, initialMatchState } from './slices/matchSlice';
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
  ...createSquadSlice(set, get, ...args),
  ...createMatchSlice(set, get, ...args),
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
      ...initialSquadState,
      ...initialMatchState,
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
