import { doc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SyncBase } from './SyncBase';

export class TacticsSync extends SyncBase {
  subscribeToTactics(teamId, store) {
    if (!teamId || !store) return;
    const colRef = collection(db, 'teams', teamId, 'tactics');
    return this._subscribe(`tactics_${teamId}`, colRef, (snapshot) => {
      const plays = snapshot.docs.map(doc => {
        const data = doc.data();
        if (Array.isArray(data.frames)) {
          data.frames = data.frames.map(f => f.players || f);
        }
        return { id: doc.id, ...data };
      });
      store.setTacticsPlays?.(plays);
    }, store);
  }

  async saveTacticsPlay(teamId, play) {
    if (!teamId || !play.id) return;
    try {
      const docRef = doc(db, 'teams', teamId, 'tactics', play.id);
      const safePlay = {
        ...play,
        frames: Array.isArray(play.frames) ? play.frames.map(f => ({ players: f })) : play.frames
      };
      await setDoc(docRef, this.stripFunctions(safePlay), { merge: true });
    } catch (e) {
      console.error('[Sync] saveTacticsPlay failed:', e);
    }
  }

  async deleteTacticsPlay(teamId, playId) {
    if (!teamId || !playId) return;
    try {
      await deleteDoc(doc(db, 'teams', teamId, 'tactics', playId));
    } catch (e) {
      console.error('[Sync] deleteTacticsPlay failed:', e);
    }
  }
}
