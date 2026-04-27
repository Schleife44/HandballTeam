import { auth, db } from '../../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp, arrayUnion } from 'firebase/firestore';
import syncService from '../../services/SyncService';

export const initialAuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isAuthLoading: true,
  activeTeamId: null,
  activeMember: null, // Data for the current user IN the active team
};

export const createAuthSlice = (set, get) => ({
  ...initialAuthState,

  initAuth: () => {
    onAuthStateChanged(auth, async (user) => {
      // 1. IMMEDIATELY stop any active sync to prevent data leaking
      syncService.stop();
      
      // 2. FORCE RESET of all slices to ensure a clean state (wait for it!)
      await get().resetAll();

      if (user) {
        console.log(`[Auth] User logged in: ${user.uid}`);
        const profile = await get().fetchProfile(user.uid);
        
        // Use a unique key per user for the active team
        const storedTeamId = localStorage.getItem(`handballActiveTeam_${user.uid}`);
        
        set({ 
          user, 
          profile, 
          isAuthenticated: true, 
          isAuthLoading: false,
          activeTeamId: storedTeamId 
        });

        if (storedTeamId) {
          console.log(`[Auth] Resuming sync for team: ${storedTeamId}`);
          syncService.start(storedTeamId, get());
          await get().fetchActiveMember();
        }
      } else {
        console.log('[Auth] User logged out');
        set({ 
          user: null, 
          profile: null, 
          isAuthenticated: false, 
          isAuthLoading: false,
          activeTeamId: null,
          activeMember: null
        });
      }
    });
  },

  fetchActiveMember: async () => {
    const { user, activeTeamId } = get();
    if (!user || !activeTeamId) return null;

    try {
      const memberRef = doc(db, 'teams', activeTeamId, 'members', user.uid);
      const snap = await getDoc(memberRef);
      if (snap.exists()) {
        const data = snap.data();
        set({ activeMember: data });
        return data;
      }
    } catch (e) {
      console.error('[Auth] Failed to fetch active member:', e);
    }
    return null;
  },

  updateActiveMember: async (data) => {
    const { user, activeTeamId } = get();
    if (!user || !activeTeamId) return { success: false };

    try {
      const memberRef = doc(db, 'teams', activeTeamId, 'members', user.uid);
      // 1. Determine or generate the playerId for the roster link
      let finalPlayerId = data.playerId || get().activeMember?.playerId;
      
      if (data.playerName && !finalPlayerId) {
        const homeRoster = get().squad?.home || [];
        const existingPlayer = homeRoster.find(p => p.name === data.playerName);
        
        if (existingPlayer) {
          finalPlayerId = existingPlayer.id;
        } else {
          // Create new player in roster and get their ID
          finalPlayerId = `p_${Date.now()}`;
          get().addPlayer?.('home', {
            id: finalPlayerId,
            name: data.playerName,
            number: data.playerNumber || '?',
            position: '?',
          });
        }
      }

      const updatePayload = {
        ...get().activeMember,
        ...data,
        playerId: finalPlayerId,
        uid: user.uid,
        email: user.email,
        updatedAt: serverTimestamp()
      };

      await setDoc(memberRef, updatePayload, { merge: true });
      set({ activeMember: updatePayload });

      return { success: true };
    } catch (e) {
      console.error('[Auth] Failed to update member:', e);
      return { success: false, error: e.message };
    }
  },

  fetchProfile: async (uid) => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    } else {
      // Create profile if missing
      const newProfile = {
        uid,
        email: auth.currentUser?.email,
        teams: [],
        createdAt: serverTimestamp()
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  },

  login: async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  register: async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  loginWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    syncService.stop();
    get().resetAll(); 
    await signOut(auth);
    // Hard reload to clear everything from memory and ensure a fresh start
    window.location.href = '/';
  },

  setActiveTeam: async (teamId) => {
    if (get().user) {
      localStorage.setItem(`handballActiveTeam_${get().user.uid}`, teamId);
    }
    set({ activeTeamId: teamId });
    if (teamId) {
      syncService.start(teamId, get());
      await get().fetchActiveMember();
    } else {
      syncService.stop();
      set({ activeMember: null });
    }
  },

  createTeam: async (data) => {
    const { teamName, teamColor, playerName, hnetUrl } = data;
    const user = get().user;
    if (!user) return { success: false, error: 'Nicht angemeldet' };

    try {
      const teamId = Date.now().toString();
      const teamRef = doc(db, 'teams', teamId);
      const memberRef = doc(db, 'teams', teamId, 'members', user.uid);
      const gameRef = doc(db, 'teams', teamId, 'games', 'current');
      const userRef = doc(db, 'users', user.uid);

      // 1. Create team doc
      await setDoc(teamRef, {
        name: teamName,
        ownerUid: user.uid,
        createdAt: new Date().toISOString(),
        settings: {
          homeName: teamName,
          homeColor: teamColor,
          awayName: 'Gegner',
          awayColor: '#3f3f46',
          hnetUrl: hnetUrl || '',
          myPlayerName: playerName,
          autoDabei: true,
          absageGrundPflicht: true,
          absageDeadline: 24
        }
      });

      // 2. Add owner as member
      await setDoc(memberRef, {
        uid: user.uid,
        email: user.email,
        role: 'trainer',
        playerName: playerName,
        playerNumber: '?',
        joinedAt: new Date().toISOString()
      });

      // 3. Create initial empty game state
      await setDoc(gameRef, {
        roster: [{ id: 'p_owner', name: playerName, number: '?', position: '?' }],
        score: { heim: 0, gegner: 0 },
        gameLog: [],
        settings: { homeColor: teamColor, awayColor: '#3f3f46', isAuswaertsspiel: false },
        lastUpdated: new Date().toISOString()
      });

      // 4. Update user profile
      const currentTeams = get().profile?.teams || [];
      const updatedTeams = [...currentTeams, { teamId, teamName, role: 'trainer' }];
      await setDoc(userRef, { 
        ...get().profile, 
        teams: updatedTeams,
        lastActiveTeamId: teamId
      }, { merge: true });

      set({ 
        activeTeamId: teamId, 
        profile: { ...get().profile, teams: updatedTeams },
        activeMember: { uid: user.uid, email: user.email, role: 'trainer', playerName, playerNumber: '?' }
      });
      
      return { success: true, teamId };
    } catch (error) {
      console.error('[Auth] Create Team error:', error);
      return { success: false, error: error.message };
    }
  },

  joinTeam: async (teamId, playerData) => {
    const { name, number } = playerData;
    const user = get().user;
    if (!user) return { success: false, error: 'Nicht angemeldet' };

    try {
      const teamRef = doc(db, 'teams', teamId);
      const memberRef = doc(db, 'teams', teamId, 'members', user.uid);
      const userRef = doc(db, 'users', user.uid);

      // 1. Add as member
      await setDoc(memberRef, {
        uid: user.uid,
        email: user.email,
        role: 'spieler', 
        playerName: name,
        playerNumber: number,
        joinedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Add team to user profile
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) throw new Error('Team existiert nicht mehr');
      const teamData = teamSnap.data();

      const currentTeams = get().profile?.teams || [];
      if (!currentTeams.some(t => t.teamId === teamId)) {
        const updatedTeams = [...currentTeams, { teamId, teamName: teamData.name, role: 'spieler' }];
        await updateDoc(userRef, { 
          teams: updatedTeams,
          lastActiveTeamId: teamId
        });
        set({ profile: { ...get().profile, teams: updatedTeams } });
      }

      // 3. Ensure they are in the roster
      await get().updateActiveMember({ playerName: name, playerNumber: number });

      return { success: true };
    } catch (error) {
      console.error('[Auth] Join Team error:', error);
      return { success: false, error: error.message };
    }
  }
});
