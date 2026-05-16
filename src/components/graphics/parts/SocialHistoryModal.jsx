import React from 'react';
import { ArrowRight } from 'lucide-react';
import Modal from '../../ui/Modal';

const SocialHistoryModal = ({ isOpen, onClose, history, onSelectGame }) => {
  const getTeamName = (game, type) => {
    if (type === 'heim') return game.settings?.teamNameHeim || game.teamNameHeim || 'Heim';
    return game.settings?.teamNameGegner || game.teamNameGegner || 'Gast';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Spiel wählen"
      size="md"
    >
      <div className="max-h-[500px] overflow-y-auto space-y-3 no-scrollbar p-1">
        {history.map((game, idx) => (
          <button
            key={game.id || idx}
            onClick={() => onSelectGame(game)}
            className="w-full p-6 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-brand/40 hover:bg-zinc-900 transition-all flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-6">
              <div className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter w-16">
                {new Date(game.date || game.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
              </div>
              <div>
                <div className="text-sm font-black text-white uppercase italic tracking-tight">
                  {getTeamName(game, 'heim')} <span className="text-zinc-600 mx-1">vs</span> {getTeamName(game, 'gegner')}
                </div>
                <div className="text-[10px] font-bold text-brand uppercase tracking-widest mt-1">
                  {game.score?.heim}:{game.score?.gegner}
                </div>
              </div>
            </div>
            <ArrowRight size={18} className="text-zinc-800 group-hover:text-brand group-hover:translate-x-1 transition-all" />
          </button>
        ))}
        {history.length === 0 && (
          <div className="p-12 text-center text-zinc-500 uppercase font-black italic text-sm">
            Keine Spiele im Archiv gefunden.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SocialHistoryModal;
