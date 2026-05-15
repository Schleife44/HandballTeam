import { useState } from 'react';
import useStore from '../store/useStore';

export const useGameSync = (game, setCurrentGame) => {
  const { updateHistoryGame } = useStore();
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncUrl, setSyncUrl] = useState('');
  const [syncStatus, setSyncStatus] = useState({ type: '', message: '' });
  const [fixingEntry, setFixingEntry] = useState(null);
  const [availableOfficial, setAvailableOfficial] = useState([]);

  const handleSync = async () => {
    if (!syncUrl) return;
    setSyncStatus({ type: 'loading', message: 'Hole Spieldaten...' });
    
    try {
      const { fetchGameData, syncGameLogs } = await import('../services/handballNetService');
      const officialData = await fetchGameData(syncUrl);
      
      if (!officialData) throw new Error("Konnte Spieldaten nicht laden");
      
      setSyncStatus({ type: 'loading', message: 'Synchronisiere Spielverlauf...' });
      const { updatedGame, report } = syncGameLogs(game, officialData);
      
      setCurrentGame(updatedGame);
      updateHistoryGame(updatedGame);
      
      setSyncStatus({ 
        type: 'success', 
        message: `Synchronisation abgeschlossen! ${report.matched} Aktionen zugeordnet.` 
      });
      
    } catch (e) {
      setSyncStatus({ type: 'error', message: e.message });
    }
  };

  const handleManualFix = (localEntry) => {
    const getSecsForSort = (str) => {
        if(!str) return 0;
        const pts = str.split(':');
        return (parseInt(pts[0])||0)*60 + (parseInt(pts[1])||0);
    };
    
    const unmatched = game.syncReport?.unmatchedOfficial || [];
    const available = unmatched.sort((a, b) => {
        const targetSecs = getSecsForSort(localEntry.time);
        return Math.abs(getSecsForSort(a.time) - targetSecs) - Math.abs(getSecsForSort(b.time) - targetSecs);
    }).filter((v, i, a) => {
        const id = v.hnetId || v.importMeta?.hnetId || v.id;
        return a.findIndex(t => (t.hnetId || t.importMeta?.hnetId || t.id) === id) === i;
    });

    setAvailableOfficial(available);
    setFixingEntry(localEntry);
  };

  const completeManualFix = (targetEvent) => {
    if (!fixingEntry || !targetEvent) return;

    const isFixingOfficial = fixingEntry.isOfficialOnly;
    const localToUpdate = isFixingOfficial ? targetEvent : fixingEntry;
    const officialDataSource = isFixingOfficial ? fixingEntry : targetEvent;

    const targetHnetId = officialDataSource.importMeta?.hnetId || officialDataSource.hnetId;

    let updatedLog = (game?.gameLog || []).map(entry => {
        if (entry === localToUpdate) {
            return {
                ...entry,
                isSynced: true,
                hnetId: targetHnetId,
                officialTime: officialDataSource.time,
                timestamp: officialDataSource.timestamp || entry.timestamp,
                syncMeta: { officialAction: officialDataSource.action, officialPlayer: officialDataSource.playerName }
            };
        }
        return entry;
    });

    const hnetIdToRemove = officialDataSource.importMeta?.hnetId || officialDataSource.hnetId;
    updatedLog = updatedLog.filter(l => !(l.isOfficialOnly && (l.hnetId || l.importMeta?.hnetId) === hnetIdToRemove));

    const updatedUnmatchedOfficial = (game.syncReport?.unmatchedOfficial || []).filter(h => 
        (h.importMeta?.hnetId || h.hnetId) !== hnetIdToRemove
    );

    const updatedGame = { 
        ...game, 
        gameLog: updatedLog,
        syncReport: {
            ...game.syncReport,
            matched: (game.syncReport?.matched || 0) + 1,
            unmatched: Math.max(0, (game.syncReport?.unmatched || 0) - 1),
            unmatchedOfficial: updatedUnmatchedOfficial
        }
    };

    setCurrentGame(updatedGame);
    updateHistoryGame(updatedGame);
    setFixingEntry(null);
    setAvailableOfficial([]);
  };

  return {
    isSyncModalOpen,
    setIsSyncModalOpen,
    syncUrl,
    setSyncUrl,
    syncStatus,
    handleSync,
    fixingEntry,
    setFixingEntry,
    availableOfficial,
    handleManualFix,
    completeManualFix
  };
};
