import { useState } from 'react';
import useStore from '../store/useStore';
import { calculateMeetingTime, processEventResponses } from '../utils/settingsUtils';

export const useSettingsData = () => {
  const { 
    squad, updateSettings, setCalendarEvents, resetAll, 
    activeTeamId, restoreEvent, activeMember, deleteTeam, 
    leaveTeam, allTeams, user, allMembers 
  } = useStore();

  const { settings = {}, home = [], hiddenEventIds = [], calendarEvents = [] } = squad || {};

  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); 
  const [isSyncing, setIsSyncing] = useState(false);

  const isClubMode = activeTeamId === 'CLUB_OVERVIEW';
  const isClubOwner = (allTeams || []).some(t => t.ownerUid === user?.uid);
  const isOwner = activeMember?.uid === squad?.ownerUid;
  const isTrainer = activeMember?.role === 'trainer' || isOwner;

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getActiveRoster = () => (home || []).filter(p => {
    const pName = p.name?.trim().toLowerCase();
    return !p.isInactive && (allMembers || []).some(m => 
      (m.playerName?.trim().toLowerCase() === pName) || (m.playerId === p.id)
    );
  });

  const handleUpdate = (key, value) => {
    updateSettings({ [key]: value });
    setHasChanges(true);
  };

  const handleApplyToAll = () => {
    const activeRoster = getActiveRoster();
    const updatedEvents = (calendarEvents || []).map(event => ({
      ...event,
      isMandatory: settings.absageGrundPflicht,
      isAutoGoing: settings.autoDabei,
      deadline: settings.absageDeadline,
      meetingTime: calculateMeetingTime(event.time, settings.defaultMeetingOffset),
      responses: processEventResponses(event, event.responses, settings, activeRoster)
    }));
    
    setCalendarEvents(updatedEvents);
    notify('Einstellungen auf alle Spiele angewendet!');
  };

  const handleSync = async () => {
    if (!settings.teamId && !settings.hnetUrl) return notify('Bitte zuerst Handball.net Link einfügen', 'error');
    setIsSyncing(true);
    
    try {
      const { syncToCalendar } = await import('../services/handballNetService');
      let effectiveTeamId = settings.teamId;
      if ((!effectiveTeamId || effectiveTeamId.length > 15) && settings.hnetUrl) {
        const match = settings.hnetUrl.match(/mannschaften\/([^/]+)/);
        if (match && match[1]) effectiveTeamId = match[1];
      }

      const hnetEvents = await syncToCalendar(effectiveTeamId, settings.homeName);
      const activeRoster = getActiveRoster();

      const newCalendarEvents = hnetEvents.map(hEvent => {
        const existing = calendarEvents.find(e => e.hnetGameId === hEvent.hnetGameId);
        return { 
          ...hEvent, 
          responses: processEventResponses(hEvent, existing?.responses, settings, activeRoster),
          meetingTime: existing?.meetingTime || calculateMeetingTime(hEvent.time, settings.defaultMeetingOffset),
          isMandatory: existing?.isMandatory ?? settings.absageGrundPflicht,
          isAutoGoing: existing?.isAutoGoing ?? settings.autoDabei,
          deadline: existing?.deadline ?? settings.absageDeadline
        };
      });

      const nonHnetEvents = calendarEvents.filter(e => !e.hnetGameId);
      setCalendarEvents([...nonHnetEvents, ...newCalendarEvents]);
      notify('Spielplan synchronisiert!');
    } catch (e) {
      notify('Fehler: ' + e.message, 'error');
    } finally { setIsSyncing(false); }
  };

  const handleDeleteTeam = async () => {
    await deleteTeam();
    window.location.reload();
  };

  const handleLeaveTeam = async () => {
    await leaveTeam();
    window.location.reload();
  };

  return {
    squad,
    settings,
    hasChanges,
    setHasChanges,
    notification,
    showResetConfirm,
    setShowResetConfirm,
    confirmModal,
    setConfirmModal,
    isSyncing,
    isClubMode,
    isClubOwner,
    isOwner,
    isTrainer,
    hiddenEventIds: hiddenEventIds,
    handleUpdate,
    handleApplyToAll,
    handleSync,
    handleDeleteTeam,
    handleLeaveTeam,
    restoreEvent,
    resetAll,
    notify
  };
};
