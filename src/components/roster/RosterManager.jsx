import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Hooks
import { useRosterData } from '../../hooks/useRosterData';

// UI
import Input from '../ui/Input';

// Parts
import RosterHeader from './parts/RosterHeader';
import PlayerCard from './parts/PlayerCard';
import PlayerStatsModal from './parts/PlayerStatsModal';

const RosterManager = () => {
  const { squad, addPlayer, updatePlayer, removePlayer, toggleStatus } = useRosterData();
  const [activeTab, setActiveTab] = useState('home');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatsPlayer, setSelectedStatsPlayer] = useState(null);

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
        onAddPlayer={handleAddPlayer}
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
                  setEditingId(player.id);
                  setEditData({ ...player });
                }}
                onToggleStatus={() => toggleStatus(activeTab, player.id)}
                onRemove={() => removePlayer(activeTab, player.id)}
                onOpenStats={() => setSelectedStatsPlayer(player)}
                teamColor={teamColor}
              />
            ))}
          </AnimatePresence>
        </div>
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
