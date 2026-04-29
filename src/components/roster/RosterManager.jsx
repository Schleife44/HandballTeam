import React, { useState } from 'react';
import { Search, Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Hooks
import { useRosterData } from '../../hooks/useRosterData';

// UI
import Input from '../ui/Input';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';

// Store
import useStore from '../../store/useStore';

// Parts
import RosterHeader from './parts/RosterHeader';
import PlayerCard from './parts/PlayerCard';
import PlayerStatsModal from './parts/PlayerStatsModal';

const RosterManager = () => {
  const { squad, addPlayer, updatePlayer, removePlayer, toggleStatus } = useRosterData();
  const { activeMember } = useStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('home');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatsPlayer, setSelectedStatsPlayer] = useState(null);

  const isOwner = activeMember?.uid === squad?.ownerUid;
  const isTrainer = activeMember?.role === 'trainer' || activeMember?.role === 'admin' || isOwner;

  const handleAddPlayer = () => {
    // Add player returns the new player now (refactored hook)
    const newPlayerId = Date.now().toString(); // Temporary until hook is fully sync
    addPlayer(activeTab);
    setEditingId(newPlayerId);
    setEditData({ id: newPlayerId, name: '', number: '', isGoalkeeper: false, isInactive: false, role: 'Spieler' });
  };

  const handleSaveEdit = () => {
    updatePlayer(activeTab, editingId, editData);
    setEditingId(null);
  };

  const teamPlayers = (squad?.[activeTab] || []).filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.number || '').includes(searchQuery)
  );

  const teamName = activeTab === 'home' ? (squad?.settings?.homeName || 'Heim') : (squad?.settings?.awayName || 'Gegner');
  const teamColor = activeTab === 'home' ? (squad?.settings?.homeColor || '#84cc16') : (squad?.settings?.awayColor || '#3f3f46');

  return (
    <div className="flex flex-col gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto pb-20">
      
      <RosterHeader 
        teamName={teamName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddPlayer={isTrainer ? handleAddPlayer : undefined}
      />

      <div className="space-y-6">
        <Input 
          icon={Search}
          placeholder={`Suchen in ${teamName}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          wrapperClassName="max-w-md"
          className="bg-zinc-900/40 rounded-[2rem] py-5"
        />

        {teamPlayers.length === 0 ? (
          <div className="mt-8">
            <EmptyState 
              icon={Users}
              title={searchQuery ? 'Keine Treffer' : 'Kader ist leer'}
              description={searchQuery ? 'Keine Spieler gefunden, die deiner Suche entsprechen.' : 'Dein Kader ist noch sehr übersichtlich. Füge neue Spieler hinzu oder teile deinen Einladungslink in den Einstellungen.'}
              variant="glass"
              action={
                !searchQuery && isTrainer && (
                  <Button variant="primary" onClick={handleAddPlayer} icon={UserPlus} className="w-full justify-center">
                    Ersten Spieler hinzufügen
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === 'home' && teamPlayers.length === 1 && !searchQuery && (
               <div className="bg-brand/5 border border-brand/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in duration-500">
                 <div className="space-y-2 text-center md:text-left">
                   <h4 className="text-xl font-black text-white uppercase italic">Lad dein Team ein!</h4>
                   <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest max-w-md">Du bist aktuell noch alleine. Kopiere den Einladungslink in den Einstellungen und schicke ihn deiner Mannschaft.</p>
                 </div>
                 <Button 
                   variant="outline" 
                   icon={Users}
                   onClick={() => navigate('/settings')}
                   className="whitespace-nowrap"
                 >
                   Zu den Einladungen
                 </Button>
               </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {teamPlayers.map((player) => (
                <PlayerCard 
                  key={player.id}
                  player={player}
                  isEditing={editingId === player.id}
                  editData={editData}
                  onEditChange={setEditData}
                  onSave={handleSaveEdit}
                  onEditStart={() => {
                    if (!isTrainer) return;
                    setEditingId(player.id);
                    setEditData({ ...player });
                  }}
                  onToggleStatus={() => {
                    if (isTrainer) toggleStatus(activeTab, player.id);
                  }}
                  onRemove={() => {
                    if (isTrainer) removePlayer(activeTab, player.id);
                  }}
                  onOpenStats={() => setSelectedStatsPlayer(player)}
                  teamColor={teamColor}
                  isTrainer={isTrainer}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      </div>

      <AnimatePresence>
        {selectedStatsPlayer && (
          <PlayerStatsModal 
            player={selectedStatsPlayer} 
            teamColor={teamColor}
            onClose={() => setSelectedStatsPlayer(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RosterManager;
