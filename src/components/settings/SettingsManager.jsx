import React from 'react';
import { Target, Sword, Shield, RotateCcw, AlertTriangle, Check, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useSettingsData } from '../../hooks/useSettingsData';

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
import InviteLinkSection from './parts/InviteLinkSection';

const SettingsManager = () => {
  const {
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
    hiddenEventIds,
    handleUpdate,
    handleApplyToAll,
    handleSync,
    handleDeleteTeam,
    handleLeaveTeam,
    restoreEvent,
    resetAll,
    notify
  } = useSettingsData();

  if (isClubMode && !isClubOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <Shield size={40} />
        </div>
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
        {hasChanges && isTrainer && (
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => { setHasChanges(false); notify('Gespeichert'); }}
          >
            Speichern
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Analysis Mode */}
        <SettingsSection title="Analyse-Modus" icon={Target} iconColor="blue" className="md:col-span-2">
          <AnalysisModeSection isZoneMode={settings.isZoneMode} onUpdate={handleUpdate} />
        </SettingsSection>

        {/* Home Team */}
        <SettingsSection title="Heim-Team" icon={Sword} iconColor="brand">
          <TeamConfig 
            label="Name" 
            name={settings.homeName} 
            color={settings.homeColor} 
            colors={colors} 
            onUpdateName={(v) => handleUpdate('homeName', v)} 
            onUpdateColor={(v) => handleUpdate('homeColor', v)} 
            isTrainer={isTrainer} 
          />
        </SettingsSection>

        {/* Away Team */}
        <SettingsSection title="Gast-Team" icon={Shield} iconColor="zinc">
          <TeamConfig 
            label="Name" 
            name={settings.awayName} 
            color={settings.awayColor} 
            colors={colors} 
            onUpdateName={(v) => handleUpdate('awayName', v)} 
            onUpdateColor={(v) => handleUpdate('awayColor', v)} 
            isTrainer={isTrainer} 
          />
        </SettingsSection>

        {/* Invite Section */}
        <InviteLinkSection 
          activeTeamId={squad?.id} 
          settings={settings} 
          notify={notify} 
        />

        {/* Members Management */}
        <SettingsSection title="Mitglieder" icon={Shield} iconColor="blue" className="md:col-span-2 relative z-[30]">
          <MemberManager />
        </SettingsSection>

        {/* Sync & Calendar */}
        <SettingsSection title="Handball.net & Kalender" icon={Shield} iconColor="brand" className="md:col-span-2 relative z-10">
          <SyncSection 
            hnetUrl={settings.hnetUrl} 
            settings={settings} 
            onUpdate={handleUpdate} 
            onSync={handleSync} 
            onApplyToAll={handleApplyToAll} 
            isSyncing={isSyncing} 
            isTrainer={isTrainer} 
          />
          <HiddenEventsList hiddenIds={hiddenEventIds} onRestore={restoreEvent} />
        </SettingsSection>

        {/* Danger Zone */}
        {isTrainer && (
          <SettingsSection title="Gefahrenzone" icon={RotateCcw} iconColor="red" className="md:col-span-2">
            <DataManagementSection 
              showResetConfirm={showResetConfirm} 
              onReset={resetAll} 
              onConfirmToggle={() => { setShowResetConfirm(true); setTimeout(() => setShowResetConfirm(false), 5000); }} 
              isOwner={isOwner} 
              onDeleteTeam={() => setConfirmModal('delete')} 
              onLeaveTeam={() => setConfirmModal('leave')} 
            />
          </SettingsSection>
        )}
      </div>

      {/* Confirmation Modals */}
      <Modal 
        isOpen={!!confirmModal} 
        onClose={() => setConfirmModal(null)} 
        title={confirmModal === 'delete' ? 'Löschen' : 'Verlassen'} 
        footer={
          <div className="flex gap-4 w-full">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmModal(null)}>Abbrechen</Button>
            <Button variant="danger" className="flex-1" onClick={confirmModal === 'delete' ? handleDeleteTeam : handleLeaveTeam}>Bestätigen</Button>
          </div>
        }
      >
        <div className="py-6 text-center space-y-4">
          <AlertTriangle size={32} className="mx-auto text-red-500" />
          <p className="text-zinc-400 text-sm">
            {confirmModal === 'delete' ? 'Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.' : 'Wirklich verlassen?'}
          </p>
        </div>
      </Modal>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }} 
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-[100] border backdrop-blur-xl flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-500 border-red-500 text-white' : 'bg-zinc-900 border-brand text-brand'}`}
          >
            {notification.type === 'error' ? <XCircle size={18} /> : <Check size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsManager;
