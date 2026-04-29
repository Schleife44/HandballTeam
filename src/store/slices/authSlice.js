import { auth, db } from '../../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, serverTimestamp, arrayUnion, query, where } from 'firebase/firestore';
import syncService from '../../services/SyncService';

export const initialAuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isAuthLoading: true,
  activeTeamId: null,
  activeMember: null, // Data for the current user IN the active team
  allMembers: [], // List of all members in the current team
  allTeams: [], // Global list of all teams owned by the user (for Club Mode)
  subscription: {
    tier: 'starter', // starter | pro | elite
    status: 'active', // active | trial | past_due | none
    expiresAt: null
  },
  isMemberLoading: false, // Tracks if we are currently fetching the activeMember data
};

export const createAuthSlice = (set, get) => ({
  ...initialAuthState,
  
  setSubscription: (sub) => set({ subscription: { ...get().subscription, ...sub } }),

  initAuth: () => {
    onAuthStateChanged(auth, async (user) => {
      // 1. IMMEDIATELY stop any active sync to prevent data leaking
      syncService.stop();
      
      // 2. FORCE RESET of all slices to ensure a clean state (wait for it!)
      await get().resetAll();

      if (user) {
        console.log(`[Auth] User logged in: ${user.uid}`);
        const profile = await get().fetchProfile(user.uid);
        
        // Priority: Profile lastActiveTeamId > localStorage > null
        const storedTeamId = profile?.lastActiveTeamId || localStorage.getItem(`handballActiveTeam_${user.uid}`);
        
        // Step 1: Set user and team info
        set({ 
          user, 
          profile, 
          isAuthenticated: true, 
          activeTeamId: storedTeamId 
        });

        // Step 2: Resume Context
        if (storedTeamId) {
          if (storedTeamId === 'CLUB_OVERVIEW') {
            console.log('[Auth] Resuming Club Mode overview');
            await get().fetchAllTeams();
          } else {
            console.log(`[Auth] Resuming core sync for team: ${storedTeamId}`);
            set({ isMemberLoading: true });
            syncService.subscribeToCore(storedTeamId, get());
            await get().fetchActiveMember();
          }
        }

        // Step 3: Unlock the UI
        set({ isAuthLoading: false });

      } else {
        console.log('[Auth] User logged out');
        set({ 
          user: null, 
          profile: null, 
          isAuthenticated: false, 
          isAuthLoading: false,
          activeTeamId: null,
          activeMember: null,
          allMembers: []
        });
      }
    });
  },

  setAllMembers: (members) => set({ allMembers: members }),

  fetchAllMembers: async () => {
    const { activeTeamId } = get();
    if (!activeTeamId) return [];

    try {
      const membersRef = collection(db, 'teams', activeTeamId, 'members');
      const snap = await getDocs(membersRef);
      const members = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      set({ allMembers: members });
      return members;
    } catch (e) {
      console.error('[Auth] Failed to fetch all members:', e);
      return [];
    }
  },

  fetchActiveMember: async () => {
    const { user, activeTeamId } = get();
    if (!user || !activeTeamId) {
      set({ isMemberLoading: false });
      return null;
    }

    set({ isMemberLoading: true });
    try {
      const memberRef = doc(db, 'teams', activeTeamId, 'members', user.uid);
      const snap = await getDoc(memberRef);
      if (snap.exists()) {
        const data = snap.data();
        set({ activeMember: data, isMemberLoading: false });
        return data;
      }
    } catch (e) {
      console.error('[Auth] Failed to fetch active member:', e);
    }
    set({ isMemberLoading: false });
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
      // Using popup again as COOP policy is now handled in vite.config.js
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Google Login Error:', error);
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
    const user = get().user;
    
    // 1. STOP Sync and CLEAR data immediately to prevent stale flicker
    syncService.stop();
    set((state) => ({
      activeTeamId: teamId,
      activeMember: null,
      squad: { 
        ...state.squad, 
        isHydrated: false,
        contextId: '', // Clear context to prevent flicker
        settings: { ...state.squad.settings },
        home: [], 
        away: [],
        calendarEvents: [],
        history: []
      },
      isMemberLoading: teamId && teamId !== 'CLUB_OVERVIEW' ? true : false
    }));

    if (user) {
      localStorage.setItem(`handballActiveTeam_${user.uid}`, teamId);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { lastActiveTeamId: teamId }).catch(e => console.error('[Auth] Failed to persist teamId:', e));
    }
    
    if (teamId && teamId !== 'CLUB_OVERVIEW') {
      syncService.subscribeToCore(teamId, get());
      await get().fetchActiveMember();
    } else if (teamId === 'CLUB_OVERVIEW') {
      await get().fetchAllTeams();
    }
  },

  fetchAllTeams: async () => {
    const user = get().user;
    if (!user) return [];

    try {
      console.log('[Auth] Fetching all teams for owner:', user.uid);
      const teamsRef = collection(db, 'teams');
      const q = query(teamsRef, where('ownerUid', '==', user.uid));
      const snap = await getDocs(q);
      const teams = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // We'll store this in a new property in authSlice to keep it clean
      set({ allTeams: teams });
      return teams;
    } catch (e) {
      console.error('[Auth] Failed to fetch all teams:', e);
      return [];
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
        subscriptionTier: 'starter',
        subscriptionStatus: 'active',
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
  },

  kickMember: async (memberUid) => {
    const { activeTeamId } = get();
    if (!activeTeamId) return { success: false };

    try {
      const memberRef = doc(db, 'teams', activeTeamId, 'members', memberUid);
      await deleteDoc(memberRef);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Kick member error:', error);
      return { success: false, error: error.message };
    }
  },

  leaveTeam: async () => {
    const { user, activeTeamId, profile } = get();
    if (!user || !activeTeamId) return { success: false };

    try {
      // 1. Remove from members collection
      const memberRef = doc(db, 'teams', activeTeamId, 'members', user.uid);
      await deleteDoc(memberRef);

      // 2. Remove from user profile
      const userRef = doc(db, 'users', user.uid);
      const updatedTeams = (profile?.teams || []).filter(t => t.teamId !== activeTeamId);
      await updateDoc(userRef, { 
        teams: updatedTeams,
        lastActiveTeamId: updatedTeams[0]?.teamId || null
      });

      // 3. Clear local state and stop sync
      syncService.stop();
      set({ 
        activeTeamId: null, 
        activeMember: null,
        profile: { ...profile, teams: updatedTeams } 
      });
      await get().resetAll();

      return { success: true };
    } catch (error) {
      console.error('[Auth] Leave team error:', error);
      return { success: false, error: error.message };
    }
  },

  updateMemberRole: async (memberUid, newRole) => {
    const { activeTeamId } = get();
    if (!activeTeamId) return { success: false };

    try {
      const memberRef = doc(db, 'teams', activeTeamId, 'members', memberUid);
      await updateDoc(memberRef, { role: newRole, updatedAt: serverTimestamp() });
      return { success: true };
    } catch (error) {
      console.error('[Auth] Update role error:', error);
      return { success: false, error: error.message };
    }
  },

  updateMemberFunction: async (memberUid, newFunction) => {
    const { activeTeamId } = get();
    if (!activeTeamId) return { success: false };

    try {
      const memberRef = doc(db, 'teams', activeTeamId, 'members', memberUid);
      await updateDoc(memberRef, { function: newFunction, updatedAt: serverTimestamp() });
      return { success: true };
    } catch (error) {
      console.error('[Auth] Update function error:', error);
      return { success: false, error: error.message };
    }
  },

  deleteTeam: async () => {
    const { activeTeamId, user, profile } = get();
    if (!activeTeamId || !user) return { success: false };

    try {
      // For safety, we only "deactivate" or delete the main doc in this phase
      // A full recursive delete of subcollections should ideally happen in a Cloud Function
      const teamRef = doc(db, 'teams', activeTeamId);
      await deleteDoc(teamRef);

      // Remove from profile
      const userRef = doc(db, 'users', user.uid);
      const updatedTeams = (profile?.teams || []).filter(t => t.teamId !== activeTeamId);
      await updateDoc(userRef, { 
        teams: updatedTeams,
        lastActiveTeamId: updatedTeams[0]?.teamId || null
      });

      syncService.stop();
      set({ 
        activeTeamId: null, 
        activeMember: null,
        profile: { ...profile, teams: updatedTeams } 
      });
      await get().resetAll();

      return { success: true };
    } catch (error) {
      console.error('[Auth] Delete team error:', error);
      return { success: false, error: error.message };
    }
  }
});
