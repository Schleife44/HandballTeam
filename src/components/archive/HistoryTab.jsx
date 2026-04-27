import React from 'react';
import { 
  Calendar, Trash2, Search, Globe 
} from 'lucide-react';

// Hooks
import { useHistory } from '../../hooks/useHistory';

// UI
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

// Sub-components
import GameCard from './components/GameCard';
import SeasonSelector from './components/SeasonSelector';
import ImportModal from './components/ImportModal';

const HistoryTab = ({ onSelectGame }) => {
  const {
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
    deleteGame
  } = useHistory();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-zinc-800 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Season Selection */}
      <SeasonSelector 
        seasons={availableSeasons} 
        selectedSeason={selectedSeason} 
        onSelect={setSelectedSeason} 
      />

      {/* Toolbar */}
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
            icon={Globe}
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

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGames.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-600 gap-4">
            <Calendar size={48} className="opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Keine Spiele gefunden</p>
          </div>
        ) : (
          filteredGames.map(game => (
            <GameCard 
              key={game.id} 
              game={game} 
              onSelect={onSelectGame} 
              onDelete={setGameToDelete} 
            />
          ))
        )}
      </div>

      {/* Modals */}
      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        url={importUrl}
        onUrlChange={setImportUrl}
        status={importStatus}
        onImport={importHandballNet}
      />

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
            <Button variant="danger" className="py-4" onClick={() => { deleteGame(gameToDelete); setGameToDelete(null); }}>Löschen</Button>
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
