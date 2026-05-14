import { doc, collection, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SyncBase } from './SyncBase';

export class CoreSync extends SyncBase {
  subscribeToCore(teamId, store) {
    if (!teamId || !store) return;

    const hydrationTimeout = setTimeout(() => {
      console.warn('[Sync] Hydration timeout reached. Forcing hydration...');
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

      if (teamData.settings) {
        store.setSettingsData?.({
          ...teamData.settings,
          homeName: teamData.settings.homeName || teamData.name || 'Mein Team'
        });
      }
      store.setHydrated?.(true);
    }, store);

    this.subscribeToRoster(teamId, store);
    this.subscribeToMembers(teamId, store);
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

  subscribeToMembers(teamId, store) {
    if (!teamId || !store) return;
    const colRef = collection(db, 'teams', teamId, 'members');
    return this._subscribe(`members_${teamId}`, colRef, (snapshot) => {
      const members = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      store.setAllMembers?.(members);
    }, store);
  }

  async saveSettings(teamId, settings) {
    if (!teamId || !settings) return;
    if (!this._checkRateLimit('saveSettings')) return;

    try {
      const teamRef = doc(db, 'teams', teamId);
      const update = { 
        name: settings.homeName, 
        settings: this.stripFunctions(settings) 
      };
      await updateDoc(teamRef, update);
    } catch (e) {
      console.error('[Sync] saveSettings failed:', e);
    }
  }

  async savePlayer(teamId, player, teamType = 'home') {
    if (!teamId || !player.id) return;
    const { setDoc } = await import('firebase/firestore');
    setDoc(doc(db, 'teams', String(teamId), 'roster', String(player.id)), this.stripFunctions({ ...player, teamType }), { merge: true });
  }

  async deletePlayer(teamId, playerId) {
    if (!teamId || !playerId) return;
    const { deleteDoc } = await import('firebase/firestore');
    deleteDoc(doc(db, 'teams', String(teamId), 'roster', String(playerId)));
  }
}
