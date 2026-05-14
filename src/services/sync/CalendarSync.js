import { doc, collection, query, orderBy, limit, setDoc, updateDoc, deleteDoc, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { SyncBase } from './SyncBase';

export class CalendarSync extends SyncBase {
  subscribeToEvents(teamId, store) {
    if (!teamId || !store) return;
    const q = query(collection(db, 'teams', teamId, 'events'), orderBy('date', 'asc'), limit(100));
    return this._subscribe(`events_${teamId}`, q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      store.setCalendarEvents?.(events);
    }, store);
  }

  async saveEvent(teamId, event) {
    if (!teamId || !event.id) return;
    setDoc(doc(db, 'teams', String(teamId), 'events', String(event.id)), this.stripFunctions(event), { merge: true });
  }

  async deleteEventResponse(teamId, eventId, playerName) {
    if (this.isApplyingRemoteChange || !teamId || !eventId || !playerName) return;
    try {
      await updateDoc(doc(db, 'teams', String(teamId), 'events', String(eventId)), {
        [`responses.${playerName}`]: deleteField()
      });
    } catch (e) {
      console.error('[Sync] deleteEventResponse failed:', e);
    }
  }

  async saveBulkEvents(teamId, events) {
    if (!teamId || !Array.isArray(events) || events.length === 0) return;
    const batch = writeBatch(db);
    events.forEach(event => {
      if (!event.id) return;
      batch.set(doc(db, 'teams', String(teamId), 'events', String(event.id)), this.stripFunctions(event), { merge: true });
    });
    await batch.commit();
  }

  async deleteEvent(teamId, eventId) {
    if (!teamId || !eventId) return;
    deleteDoc(doc(db, 'teams', String(teamId), 'events', String(eventId)));
  }

  async saveHiddenEventIds(teamId, hiddenIds) {
    if (!teamId) return;
    updateDoc(doc(db, 'teams', teamId), { hiddenEventIds: hiddenIds });
  }

  async saveSubscriptions(teamId, subscriptions) {
    if (!teamId) return;
    updateDoc(doc(db, 'teams', teamId), { calendarSubscriptions: this.stripFunctions(subscriptions) });
  }
}
