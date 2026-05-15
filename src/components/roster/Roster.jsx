import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Store & Hooks
import useStore from '../../store/useStore';
import { useHistory } from '../../hooks/useHistory';
import { useRosterData } from '../../hooks/useRosterData';
import { useRosterStats } from '../../hooks/useRosterStats';

// Utils
import { normalizeSearchString } from '../../utils/searchUtils';
import { normalizeText } from '../../utils/dataUtils';

// Modular Components
import RosterHeader from './components/RosterHeader';
import RosterFilters from './components/RosterFilters';
import RosterTable from './components/RosterTable';
import PremiumPlayerCard from './parts/PremiumPlayerCard';

const Roster = () => {
  const { squad, allMembers, activeMember } = useStore();
  const { addPlayer, updatePlayer, removePlayer, toggleStatus } = useRosterData();
  const { filteredGames } = useHistory();
  const navigate = useNavigate();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); 
  const [viewMode, setViewMode] = useState('grid'); 
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'number', direction: 'asc' });

  // Permissions
  const isOwner = activeMember?.uid === squad?.ownerUid;
  const isTrainer = activeMember?.role === 'trainer' || activeMember?.role === 'admin' || isOwner;

  // Data Logic: Statistics (Extracted to Hook)
  const playerStatsMap = useRosterStats(squad, filteredGames);

  // Data Logic: Filtering & Sorting
  const corePlayers = useMemo(() => (squad?.home || []).filter(p => {
    const isTemp = p.isTemporary || p.isGuest || p.id?.startsWith('quick_') || p.id?.startsWith('opp_') || p.id?.startsWith('neutral_') || p.id?.startsWith('guest_');
    return !isTemp;
  }), [squad?.home]);

  const sortedFilteredPlayers = useMemo(() => {
    const filtered = corePlayers.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = 
        filter === 'all' ? true :
        filter === 'active' ? !p.isInactive :
        filter === 'inactive' ? p.isInactive :
        (!p.isInactive && (p.position === filter || p.position2 === filter || (filter === 'TW' && p.isGoalkeeper)));
      return matchesSearch && matchesFilter;
    });

    return [...filtered].sort((a, b) => {
      if (viewMode === 'grid') {
        const numA = parseInt(a.number) || 999;
        const numB = parseInt(b.number) || 999;
        return numA - numB;
      }
      
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'number') {
        return sortConfig.direction === 'asc' ? (parseInt(valA) || 999) - (parseInt(valB) || 999) : (parseInt(valB) || 999) - (parseInt(valA) || 999);
      }
      if (sortConfig.key === 'goals') {
        valA = playerStatsMap[normalizeSearchString(a.name)]?.tore || 0;
        valB = playerStatsMap[normalizeSearchString(b.name)]?.tore || 0;
      }
      if (sortConfig.key === 'training') {
        valA = playerStatsMap[normalizeSearchString(a.name)]?.training || 0;
        valB = playerStatsMap[normalizeSearchString(b.name)]?.training || 0;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.trim().localeCompare(valB.trim(), 'de', { sensitivity: 'base' });
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      }
      return sortConfig.direction === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    });
  }, [corePlayers, searchTerm, filter, sortConfig, playerStatsMap, viewMode]);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const handleAddPlayer = () => {
    const newId = `new_${Date.now()}`;
    setEditingId(newId);
    setEditData({ id: newId, name: '', number: '', position: 'RM', isGoalkeeper: false });
  };

  const handleSaveEdit = (id, data) => {
    const normalizedData = { ...data, name: normalizeText(data.name) };
    if (id.startsWith('new_')) {
      const { id: _, ...cleanData } = normalizedData;
      addPlayer('home', cleanData);
    } else {
      updatePlayer('home', id, normalizedData);
    }
    setEditingId(null);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-8 space-y-12 animate-in fade-in duration-1000 pb-32">
      <RosterHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAddPlayer={handleAddPlayer}
        isTrainer={isTrainer}
      />

      <RosterFilters 
        filter={filter}
        setFilter={setFilter}
        corePlayers={corePlayers}
      />

      <AnimatePresence mode="popLayout">
        {viewMode === 'list' ? (
          <RosterTable 
            players={sortedFilteredPlayers}
            statsMap={playerStatsMap}
            editingId={editingId}
            setEditingId={setEditingId}
            editData={editData}
            setEditData={setEditData}
            sortConfig={sortConfig}
            onSort={handleSort}
            onSave={handleSaveEdit}
            onRemove={(id) => removePlayer('home', id)}
            onNavigate={navigate}
            isTrainer={isTrainer}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {editingId && editingId.startsWith('new_') && (
              <PremiumPlayerCard 
                player={editData}
                isEditing={true}
                editData={editData}
                onEditChange={setEditData}
                onSave={() => handleSaveEdit(editingId, editData)}
                onRemove={() => setEditingId(null)}
                stats={{ tore: 0, fehlwurf: 0, games: 0, training: 0 }}
              />
            )}
            {sortedFilteredPlayers.map(player => {
              const linkedMember = allMembers.find(m => m.playerName === player.name || m.playerId === player.id);
              const stats = playerStatsMap[normalizeSearchString(player.name)] || { tore: 0, fehlwurf: 0, games: 0, training: 0 };
              
              return (
                <PremiumPlayerCard 
                  key={player.id}
                  player={player}
                  photoURL={linkedMember?.photoURL}
                  isConnected={!!linkedMember}
                  stats={stats}
                  isEditing={editingId === player.id}
                  editData={editData}
                  onEditChange={setEditData}
                  onSave={() => handleSaveEdit(player.id, editData)}
                  onEditStart={() => {
                    if (!isTrainer) return;
                    setEditingId(player.id);
                    setEditData({ ...player });
                  }}
                  onToggleStatus={() => toggleStatus('home', player.id)}
                  onRemove={() => removePlayer('home', player.id)}
                  onOpenStats={() => navigate(`/roster/${player.name}`)}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Roster;
