import { useState, useEffect, useMemo } from 'react';
import useStore from '../store/useStore';

/**
 * useHistory Hook
 * Manages game history logic, filtering, and imports.
 */
export const useHistory = () => {
  const { 
    history: games, 
    setHistory, 
    addGameToHistory, 
    deleteGameFromHistory,
    squad,
    activeTeamId
  } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(squad?.settings?.currentSeason || '25/26');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importStatus, setImportStatus] = useState({ type: '', message: '' });
  const [gameToDelete, setGameToDelete] = useState(null);

  // Migration logic (scoped to activeTeamId)
  useEffect(() => {
    if (games && games.length === 0 && activeTeamId) {
      try {
        const raw = localStorage.getItem(`handball_history_${activeTeamId}`);
        // Fallback to global if nothing found for team (one-time migration)
        const globalRaw = localStorage.getItem('handball_history_global');
        
        const dataToMigrate = raw || globalRaw;
        if (dataToMigrate) {
          const parsed = JSON.parse(dataToMigrate);
          if (parsed && parsed.length > 0) {
            setHistory(parsed);
            console.log(`[History] Migrated ${parsed.length} games for team ${activeTeamId}`);
          }
        }
      } catch (e) {
        console.error("[History] Migration error:", e);
      }
    }
    setLoading(false);
  }, [games?.length, setHistory, activeTeamId]);

  const allArchiveGames = useMemo(() => {
    return [...(games || [])]
      .filter(Boolean)
      .sort((a, b) => {
        const timeA = a.timestamp || new Date(a.date || a.id).getTime() || 0;
        const timeB = b.timestamp || new Date(b.date || b.id).getTime() || 0;
        return timeB - timeA;
      });
  }, [games]);

  const availableSeasons = useMemo(() => {
    return Array.from(new Set([
      squad?.settings?.currentSeason || '25/26',
      ...allArchiveGames.map(g => g.season).filter(Boolean)
    ])).sort((a, b) => b.localeCompare(a));
  }, [allArchiveGames, squad?.settings?.currentSeason]);

  const filteredGames = useMemo(() => {
    return allArchiveGames.filter(game => {
      if (!game) return false;
      // Handle multiple naming conventions for backward compatibility
      const homeName = game.teamHome || game.settings?.teamNameHeim || game.teamNameHeim || game.teams?.heim || game.title || 'Heim';
      const awayName = game.teamAway || game.settings?.teamNameGegner || game.teamNameGegner || game.teams?.away || game.teams?.gegner || 'Gast';
      
      const matchesSearch = (
        homeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        awayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const currentSeasonToken = squad?.settings?.currentSeason || '25/26';
      const matchesSeason = game.season === selectedSeason || (!game.season && selectedSeason === currentSeasonToken);
      
      return matchesSearch && matchesSeason;
    });
  }, [allArchiveGames, searchTerm, selectedSeason, squad?.settings?.currentSeason]);

  const importHandballNet = async () => {
    if (!importUrl) return;

    const { parseGameId, fetchGameData, mapToInternal } = await import('../services/handballNetService');
    const gameId = parseGameId(importUrl);
    
    if (!gameId) {
      setImportStatus({ type: 'error', message: 'Ungültige URL. Bitte Link zum Spielbericht kopieren.' });
      return;
    }

    setImportStatus({ type: 'loading', message: 'Daten werden geladen...' });
    try {
      let myTeamName = squad?.settings?.homeName || "Mein Team";

      const raw = await fetchGameData(gameId);
      const game = mapToInternal(raw, myTeamName);
      
      if (games.some(g => g.id === game.id)) {
        setImportStatus({ type: 'error', message: 'Dieses Spiel existiert bereits in deiner Historie.' });
        return;
      }

      addGameToHistory(game);
      setImportStatus({ type: 'success', message: `Spiel für "${myTeamName}" importiert!` });
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportUrl('');
        setImportStatus({ type: '', message: '' });
      }, 1500);
    } catch (e) {
      console.error(e);
      setImportStatus({ type: 'error', message: 'Fehler beim Import: ' + e.message });
    }
  };

  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportStatus({ type: 'loading', message: 'Verarbeite JSON Datei...' });
    setIsImportModalOpen(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        const dataToAppend = Array.isArray(importedData) ? importedData : [importedData];
        
        const existingIds = new Set(games.map(g => g.id));
        const newGames = dataToAppend.filter(g => !existingIds.has(g.id));
        
        if (newGames.length === 0) {
          setImportStatus({ type: 'error', message: 'Diese Daten existieren bereits im Archiv.' });
          return;
        }

        newGames.forEach(g => addGameToHistory(g));
        
        setImportStatus({ type: 'success', message: `${newGames.length} Spiel(e) erfolgreich importiert!` });
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportStatus({ type: '', message: '' });
        }, 2000);
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Fehler beim Lesen der JSON Datei: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  return {
    loading,
    searchTerm,
    setSearchTerm,
    selectedSeason,
    setSelectedSeason,
    isImportModalOpen,
    setIsImportModalOpen,
    importUrl,
    setImportUrl,
    importStatus,
    gameToDelete,
    setGameToDelete,
    availableSeasons,
    filteredGames,
    importHandballNet,
    handleJsonUpload,
    deleteGame: deleteGameFromHistory
  };
};
