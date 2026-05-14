import React, { useState } from 'react';
import { Save, Shield, Sword, Target, RotateCcw, Info, Check, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Store
import useStore from '../../store/useStore';

// UI Components
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import SettingsSection from './parts/SettingsSection';
import AnalysisModeSection from './parts/AnalysisModeSection';
import { TeamConfig } from './parts/IdentitySection';
import SyncSection from './parts/SyncSection';
import HiddenEventsList from './parts/HiddenEventsList';
import DataManagementSection from './parts/DataManagementSection';
import MemberManager from './parts/MemberManager';
import ClubMemberManager from './parts/ClubMemberManager';
import InviteLinkSection from './parts/InviteLinkSection';

// Utils
import { calculateMeetingTime, processEventResponses } from '../../utils/settingsUtils';

const SettingsManager = () => {
  const { 
    squad, updateSettings, setCalendarEvents, resetAll, 
    activeTeamId, restoreEvent, activeMember, deleteTeam, 
    leaveTeam, allTeams, user, allMembers 
  } = useStore();

  const { settings = {}, home = [], away = [], hiddenEventIds = [], calendarEvents = [] } = squad || {};

  const isClubMode = activeTeamId === 'CLUB_OVERVIEW';
  const isClubOwner = (allTeams || []).some(t => t.ownerUid === user?.uid);
  const isOwner = activeMember?.uid === squad?.ownerUid;
  const isTrainer = activeMember?.role === 'trainer' || isOwner;

  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); 
  const [isSyncing, setIsSyncing] = useState(false);

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
      const { syncToCalendar } = await import('../../services/handballNetService');
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

  if (isClubMode && !isClubOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500"><Shield size={40} /></div>
        <h2 className="text-2xl font-black text-white uppercase italic">Zugriff verweigert</h2>
      </div>
    );
  }

  const colors = ['#84cc16', '#dc3545', '#2563eb', '#f59e0b', '#7c3aed', '#ec4899', '#3f3f46', '#ffffff'];

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-100">System-Einstellungen</h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Konfiguriere dein Sechsmeter Erlebnis</p>
        </div>
        {hasChanges && isTrainer && <Button variant="primary" size="lg" onClick={() => { setHasChanges(false); notify('Gespeichert'); }}>Speichern</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SettingsSection title="Analyse-Modus" icon={Target} iconColor="blue" className="md:col-span-2">
          <AnalysisModeSection isZoneMode={settings.isZoneMode} onUpdate={handleUpdate} />
        </SettingsSection>

        <SettingsSection title="Heim-Team" icon={Sword} iconColor="brand">
          <TeamConfig label="Name" name={settings.homeName} color={settings.homeColor} colors={colors} onUpdateName={(v) => handleUpdate('homeName', v)} onUpdateColor={(v) => handleUpdate('homeColor', v)} isTrainer={isTrainer} />
        </SettingsSection>

        <SettingsSection title="Gast-Team" icon={Shield} iconColor="zinc">
          <TeamConfig label="Name" name={settings.awayName} color={settings.awayColor} colors={colors} onUpdateName={(v) => handleUpdate('awayName', v)} onUpdateColor={(v) => handleUpdate('awayColor', v)} isTrainer={isTrainer} />
        </SettingsSection>

        <InviteLinkSection activeTeamId={activeTeamId} settings={settings} notify={notify} />

        <SettingsSection title="Mitglieder" icon={Shield} iconColor="blue" className="md:col-span-2 relative z-[30]"><MemberManager /></SettingsSection>

        <SettingsSection title="Handball.net & Kalender" icon={Shield} iconColor="brand" className="md:col-span-2 relative z-10">
          <SyncSection hnetUrl={settings.hnetUrl} settings={settings} onUpdate={handleUpdate} onSync={handleSync} onApplyToAll={handleApplyToAll} isSyncing={isSyncing} isTrainer={isTrainer} />
          <HiddenEventsList hiddenIds={hiddenEventIds} onRestore={restoreEvent} />
        </SettingsSection>

        {isTrainer && (
          <SettingsSection title="Gefahrenzone" icon={RotateCcw} iconColor="red" className="md:col-span-2">
            <DataManagementSection showResetConfirm={showResetConfirm} onReset={resetAll} onConfirmToggle={() => { setShowResetConfirm(true); setTimeout(() => setShowResetConfirm(false), 5000); }} isOwner={isOwner} onDeleteTeam={() => setConfirmModal('delete')} onLeaveTeam={() => setConfirmModal('leave')} />
          </SettingsSection>
        )}
      </div>

      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title={confirmModal === 'delete' ? 'Löschen' : 'Verlassen'} footer={<div className="flex gap-4 w-full"><Button variant="ghost" className="flex-1" onClick={() => setConfirmModal(null)}>Abbrechen</Button><Button variant="danger" className="flex-1" onClick={async () => { if (confirmModal === 'delete') await deleteTeam(); else await leaveTeam(); window.location.reload(); }}>Bestätigen</Button></div>}>
        <div className="py-6 text-center space-y-4"><AlertTriangle size={32} className="mx-auto text-red-500" /><p className="text-zinc-400 text-sm">{confirmModal === 'delete' ? 'Wirklich löschen?' : 'Wirklich verlassen?'}</p></div>
      </Modal>

      <AnimatePresence>{notification && <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-[100] border backdrop-blur-xl flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-500 border-red-500 text-white' : 'bg-zinc-900 border-brand text-brand'}`}>{notification.type === 'error' ? <XCircle size={18} /> : <Check size={18} />}<span className="text-[10px] font-black uppercase tracking-widest">{notification.msg}</span></motion.div>}</AnimatePresence>
    </div>
  );
};

export default SettingsManager;
