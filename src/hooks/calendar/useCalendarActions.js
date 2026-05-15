import { getDay } from 'date-fns';
import useStore from '../../store/useStore';

export const useCalendarActions = (events, series, subscriptions, activeMember) => {
  const { 
    setCalendarEvents, 
    addAbsence: storeAddAbsence, 
    removeAbsence: storeRemoveAbsence,
    updateSubscriptions,
    updateSeries,
    updateEventStatus,
    removeEvent
  } = useStore();

  const handleUpdateStatus = (eventId, status, reason = '', playerName) => {
    const nameToUpdate = playerName || activeMember?.playerName;
    if (!nameToUpdate) return;
    updateEventStatus(eventId, nameToUpdate, status, reason);
  };

  const handleAddAbsence = (absenceData) => {
    const newAbs = { 
      type: absenceData.type, 
      reason: absenceData.reason, 
      ...(absenceData.type === 'Einmalig' ? { start: absenceData.start, end: absenceData.end } : { day: parseInt(absenceData.day) }) 
    };
    storeAddAbsence(newAbs);
  };

  const executeDeletion = (type, id) => {
    if (type === 'event') removeEvent(id);
    else if (type === 'series') {
      const s = series.find(ser => ser.id === id);
      if (s) setCalendarEvents(events.filter(e => !(e.title === s.title && getDay(new Date(e.date)) === s.day && e.type === 'Training')));
      updateSeries(series.filter(ser => ser.id !== id));
    } else if (type === 'abo') {
      const sub = subscriptions.find(s => s.id === id);
      if (sub && sub.type === 'hnet') {
        setCalendarEvents(events.filter(e => !e.hnetGameId && !e.id?.toString().startsWith('hnet_')));
      } else if (sub) {
        setCalendarEvents(events.filter(e => e.subscriptionId !== id));
      }
      updateSubscriptions(subscriptions.filter(s => s.id !== id));
    } else if (type === 'absence') storeRemoveAbsence(id);
    else if (type === 'guest') {
      const { eventId, playerName } = id;
      const { removeEventResponse } = useStore.getState();
      removeEventResponse(eventId, playerName);
    }
  };

  const saveSeriesTitle = (id, newTitle) => {
    const s = series.find(ser => ser.id === id);
    if (s && newTitle) {
      updateSeries(series.map(item => item.id === id ? { ...item, title: newTitle } : item));
      setCalendarEvents(events.map(e => (e.title === s.title && getDay(new Date(e.date)) === s.day) ? { ...e, title: newTitle } : e));
    }
  };

  return {
    handleUpdateStatus,
    handleAddAbsence,
    executeDeletion,
    saveSeriesTitle
  };
};
