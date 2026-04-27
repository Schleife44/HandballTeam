import React, { useState, useEffect } from 'react';
import { 
  Calendar, Trash2, Video, BarChart2, ChevronRight, 
  Search, Globe, Activity, CheckCircle2 
} from 'lucide-react';

// Store
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const HistoryTab = ({ onSelectGame }) => {
  const { 
    history: games, 
    setHistory, 
    addGameToHistory, 
    deleteGameFromHistory,
    squad 
  } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importStatus, setImportStatus] = useState({ type: '', message: '' });
  const [gameToDelete, setGameToDelete] = useState(null);

  useEffect(() => {
    // Migration: Load from old storage if store is empty
    if (games && games.length === 0) {
      try {
        const raw = localStorage.getItem('handball_history_global');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.length > 0) {
            setHistory(parsed);
          }
        }
      } catch (e) {
        console.error("Migration error:", e);
      }
    }
    setLoading(false);
  }, [games?.length, setHistory]);

  const allArchiveGames = [...(games || [])].sort((a, b) => {
    const dateA = new Date(a.timestamp || a.date || a.id);
    const dateB = new Date(b.timestamp || b.date || b.id);
    return dateB - dateA;
  });

  const filteredGames = allArchiveGames.filter(game => {
    const heim = (game.settings?.teamNameHeim || game.teamNameHeim || game.title || 'Heim').toLowerCase();
    const gast = (game.settings?.teamNameGegner || game.teamNameGegner || 'Gast').toLowerCase();
    return heim.includes(searchTerm.toLowerCase()) || gast.includes(searchTerm.toLowerCase());
  });

  const importHandballNet = async () => {
    if (!importUrl) return;

    const { parseGameId, fetchGameData, mapToInternal } = await import('../../services/handballNetService');
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

        // Add all new games
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-zinc-800 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <div className="relative flex-1">
          <Input 
            placeholder="Nach Gegner oder Spiel suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            noPadding
            className="border-none bg-zinc-950"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <Button 
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            icon={Video}
            className="text-[10px] py-3 whitespace-nowrap"
          >
            Hnet Import
          </Button>
          
          <label className="cursor-pointer flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-brand hover:border-brand/30 transition-all shadow-lg whitespace-nowrap">
              <Globe size={14} className="text-brand" />
              JSON
            </div>
            <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
          </label>

          <div className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-black text-zinc-500 uppercase">Total:</span>
            <span className="text-sm font-black text-brand">{filteredGames.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGames.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-600 gap-4">
            <Calendar size={48} className="opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Keine Spiele gefunden</p>
          </div>
        ) : (
          filteredGames.map(game => (
            <Card 
              key={game.id}
              className="p-5 group cursor-pointer hover:border-brand/30 transition-all"
              onClick={() => onSelectGame(game, 'game_stats')}
            >
              <div className="flex flex-col gap-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <Calendar size={12} />
                    {(() => {
                      const d = new Date(game.timestamp || game.date || game.id);
                      return isNaN(d.getTime()) ? 'Unbekannt' : d.toLocaleDateString('de-DE');
                    })()}
                    <div className="h-3 w-[1px] bg-zinc-800 mx-1" />
                    {(game.isSynced && game.syncReport) ? (
                      <Badge variant="brand" className="text-[8px] py-0.5">
                        <CheckCircle2 size={10} className="mr-1" /> Abgeglichen
                      </Badge>
                    ) : (game.hnetGameId || game.isSynced) ? (
                      <Badge variant="outline" className="text-[8px] py-0.5 text-blue-400 border-blue-400/20">
                        <Globe size={10} className="mr-1" /> Handball.net
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[8px] py-0.5 text-orange-400 border-orange-400/20">
                        <Activity size={10} className="mr-1" /> Manuell
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    icon={Trash2} 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setGameToDelete(game.id || game.timestamp || game.date); 
                    }}
                    className="text-zinc-600 hover:text-red-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-200">{game.settings?.teamNameHeim || game.teams?.heim || 'Heim'}</span>
                    <span className="text-lg font-black text-brand italic">{game.score?.heim ?? game.score?.home ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-200">{game.settings?.teamNameGegner || game.teams?.gegner || 'Gast'}</span>
                    <span className="text-lg font-black text-brand italic">{game.score?.gegner ?? game.score?.away ?? 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50 mt-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    icon={Video}
                    onClick={(e) => { e.stopPropagation(); onSelectGame(game, 'video'); }}
                    className="text-[9px] py-1 h-auto"
                  >
                    Video
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    icon={BarChart2}
                    onClick={(e) => { e.stopPropagation(); onSelectGame(game, 'game_stats'); }}
                    className="text-[9px] py-1 h-auto"
                  >
                    Stats
                  </Button>
                  <div className="flex-1" />
                  <ChevronRight size={16} className="text-zinc-700 group-hover:text-brand group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        title="Spiel importieren"
      >
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-brand/10 rounded-xl mt-1">
              <Globe size={20} className="text-brand" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100 uppercase tracking-tight">Handball.net Spielbericht</p>
              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-1">Füge den Link zum offiziellen Spielbericht ein, um alle Daten automatisch zu laden.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input 
              label="Spielbericht URL"
              placeholder="https://www.handball.net/spiele/..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
            />

            {importStatus.message && (
              <Badge 
                variant={importStatus.type === 'error' ? 'danger' : importStatus.type === 'success' ? 'brand' : 'outline'}
                className="w-full py-3 justify-center text-[10px]"
              >
                {importStatus.message}
              </Badge>
            )}

            <Button 
              variant="primary"
              className="w-full py-4 mt-2"
              onClick={importHandballNet}
              disabled={!importUrl || importStatus.type === 'loading'}
            >
              Jetzt Importieren
            </Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!gameToDelete} 
        onClose={() => setGameToDelete(null)} 
        title="Spiel löschen?"
      >
        <div className="flex flex-col gap-6">
          <Card className="p-6 bg-red-500/5 border border-red-500/10 text-center">
            <Trash2 size={48} className="text-red-500/20 mx-auto mb-4" />
            <p className="text-sm font-bold text-zinc-200">Möchtest du dieses Spiel wirklich permanent entfernen?</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2">Diese Aktion kann nicht rückgängig gemacht werden.</p>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="ghost" className="py-4" onClick={() => setGameToDelete(null)}>Abbrechen</Button>
            <Button variant="danger" className="py-4" onClick={() => { deleteGameFromHistory(gameToDelete); setGameToDelete(null); }}>Löschen</Button>
          </div>
        </div>
      </Modal>

      <div className="flex justify-center mt-8 pb-4">
        <p className="text-xs text-zinc-500 opacity-50 flex items-center gap-2">
          <span>Datenquelle: handball.net / DHB</span>
        </p>
      </div>
    </div>
  );
};

export default HistoryTab;
