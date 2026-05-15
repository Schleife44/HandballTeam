import { doc, collection, query, orderBy, limit, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SyncBase } from './SyncBase';

export class FineSync extends SyncBase {
  subscribeToFines(teamId, store) {
    if (!teamId || !store) return;
    const q = query(collection(db, 'teams', teamId, 'fines'), orderBy('date', 'desc'), limit(200));
    return this._subscribe(`fines_${teamId}`, q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      store.setFinesHistory?.(history);
    }, store);
  }

  hydrateFines(data, store) {
    if (!store) return;
    if (data.finesCatalog || data.finesSettings) {
      store.setFinesData?.({
        catalog: data.finesCatalog,
        settings: data.finesSettings,
        status: data.finesStatus
      });
    }
    store.setHydrated?.(true);
  }

  async saveFines(teamId, fines) {
    if (!teamId || !fines) return;
    if (!this._checkRateLimit('saveFines')) return;
    try {
      await updateDoc(doc(db, 'teams', teamId), { fines: this.stripFunctions(fines) });
    } catch (e) {
      console.error('[Sync] saveFines failed:', e);
    }
  }

  async saveFineEntry(teamId, fine) {
    if (!teamId || !fine.id) return;
    if (!this._checkRateLimit('saveFineEntry')) return;
    try {
      await setDoc(doc(db, 'teams', teamId, 'fines', fine.id), this.stripFunctions(fine));
    } catch (e) {
      console.error('[Sync] saveFineEntry failed:', e);
    }
  }
  
  async saveBulkFineEntries(teamId, entries) {
    if (!teamId || !entries?.length) return;
    const { writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(db);
    
    entries.forEach(fine => {
      if (!fine.id) return;
      const ref = doc(db, 'teams', teamId, 'fines', fine.id);
      batch.set(ref, this.stripFunctions(fine));
    });
    
    try {
      await batch.commit();
      console.log(`[Sync] Successfully saved ${entries.length} fines in batch.`);
    } catch (e) {
      console.error('[Sync] Bulk save failed:', e);
    }
  }

  async deleteFineEntry(teamId, fineId) {
    if (!teamId || !fineId) return;
    try {
      await deleteDoc(doc(db, 'teams', String(teamId), 'fines', String(fineId)));
    } catch (e) {
      console.error('[Sync] deleteFineEntry failed:', e);
    }
  }
}
