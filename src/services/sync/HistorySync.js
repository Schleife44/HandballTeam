import { doc, collection, query, orderBy, limit, where, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SyncBase } from './SyncBase';

export class HistorySync extends SyncBase {
  subscribeToHistory(teamId, store, limitCount = 20, season = null) {
    if (!teamId || !store) return;
    
    let q;
    const historyCol = collection(db, 'teams', teamId, 'history');
    
    if (season) {
      q = query(historyCol, where('season', '==', season));
    } else {
      q = query(historyCol, orderBy('date', 'desc'), limit(limitCount));
    }

    const subKey = season ? `history_${teamId}_${season}` : `history_${teamId}_latest`;
    return this._subscribe(subKey, q, (snapshot) => {
      let history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (season) {
        history.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
      }
      store.setHistory?.(history);
    }, store);
  }

  async saveHistoryGame(teamId, gameData) {
    if (!teamId) return;
    if (!this._checkRateLimit('saveHistoryGame')) return;
    try {
      await setDoc(doc(db, 'teams', teamId, 'history', gameData.id), this.stripFunctions(gameData));
    } catch (e) {
      console.error('[Sync] saveHistoryGame failed:', e);
    }
  }

  async saveSeasonData(teamId, season, data) {
    if (!teamId || !season) return;
    const seasonId = season.replace('/', '-');
    const docRef = doc(db, 'teams', teamId, 'season_data', seasonId);
    try {
      await setDoc(docRef, this.stripFunctions({ ...data, lastUpdated: new Date().toISOString() }), { merge: true });
    } catch (e) {
      console.error('[Sync] saveSeasonData failed:', e);
    }
  }

  async fetchSeasonData(teamId, season) {
    if (!teamId || !season) return null;
    const seasonId = season.replace('/', '-');
    try {
      const snap = await getDoc(doc(db, 'teams', teamId, 'season_data', seasonId));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.error('[Sync] fetchSeasonData failed:', e);
      return null;
    }
  }

  async fetchHistoryDetails(teamId, gameId) {
    if (!teamId || !gameId) return null;
    try {
      const snap = await getDoc(doc(db, 'teams', String(teamId), 'history', String(gameId), 'details', 'tactical'));
      if (snap.exists()) return snap.data();
    } catch (e) {
      console.error('[Sync] fetchHistoryDetails failed:', e);
    }
    return null;
  }

  async deleteHistoryGame(teamId, gameId) {
    if (!teamId || !gameId) return;
    const gid = String(gameId);
    await deleteDoc(doc(db, 'teams', String(teamId), 'history', gid));
    await deleteDoc(doc(db, 'teams', String(teamId), 'history', gid, 'details', 'tactical'));
  }
}
