import React, { useState, useMemo } from 'react';
import { Share2, Image as ImageIcon, History, ArrowRight, Play, Trophy, Calendar } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Store & Hooks
import useStore from '../../store/useStore';
import { useSocialPermissions } from '../../hooks/useSocialPermissions';

// UI
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import SubscriptionGuard from '../auth/SubscriptionGuard';

// Modular Components
import ResultImageEditor from './ResultImageEditor';
import ResultPreviewModal from './ResultPreviewModal';
import SocialStudioCta from './parts/SocialStudioCta';
import SocialHistoryModal from './parts/SocialHistoryModal';

const SocialHub = () => {
  const { history, squad } = useStore();
  const { canManageSocial } = useSocialPermissions();
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameForEditor, setGameForEditor] = useState(null);

  const sortedHistory = useMemo(() => 
    [...history].sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp)), 
    [history]
  );

  const latestGame = sortedHistory[0];

  const getTeamName = (game, type) => {
    if (type === 'heim') return game.settings?.teamNameHeim || game.teamNameHeim || 'Heim';
    return game.settings?.teamNameGegner || game.teamNameGegner || 'Gast';
  };

  return (
    <SubscriptionGuard 
      title="Social Engine Studio" 
      description="Erstelle professionelle Match-Grafiken für Instagram & Co. direkt aus deinen Spieldaten. Exklusiv für Pro-Teams."
    >
      <div className="max-w-[1200px] mx-auto pb-32 px-8 pt-4 space-y-12 animate-in fade-in duration-1000">
        
        {/* HEADER */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-zinc-100">Social</h1>
            <Badge variant="brand" className="px-3 py-1 text-[10px]">Studio</Badge>
          </div>
          <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">Design & Media Hub</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
          
          {/* LEFT ACTIONS */}
          <div className="space-y-8">
            <SocialStudioCta 
              canManageSocial={canManageSocial} 
              onClick={() => setGameForEditor(latestGame || {})} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-10 rounded-[3rem] bg-zinc-900/20 border-white/5 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><ImageIcon size={24} /></div>
                <h4 className="text-sm font-black text-zinc-100 uppercase italic">Smart Layouts</h4>
                <p className="text-[10px] font-bold text-zinc-600 uppercase leading-relaxed tracking-wider">Deine Einstellungen werden automatisch gespeichert.</p>
              </Card>
              <Card className="p-10 rounded-[3rem] bg-zinc-900/20 border-white/5 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center"><Share2 size={24} /></div>
                <h4 className="text-sm font-black text-zinc-100 uppercase italic">Social Ready</h4>
                <p className="text-[10px] font-bold text-zinc-600 uppercase leading-relaxed tracking-wider">Optimiert für den Instagram Feed (1:1).</p>
              </Card>
            </div>
          </div>

          {/* RIGHT: TIPS & LATEST GAME */}
          <div className="space-y-8">
            <div className="p-10 rounded-[3rem] bg-brand text-black space-y-6 relative overflow-hidden shadow-2xl shadow-brand/20">
              <div className="absolute -right-6 -bottom-6 text-black/10 rotate-12"><Play size={120} fill="currentColor" /></div>
              <div className="flex items-center gap-3">
                <Trophy size={20} strokeWidth={3} />
                <h4 className="text-xl font-black uppercase italic leading-none">Pro Tip</h4>
              </div>
              <p className="text-[10px] font-black uppercase leading-relaxed opacity-90">
                Nutze ein actionreiches Hintergrundbild für beste Ergebnisse.
              </p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="w-full flex items-center justify-between p-8 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 hover:border-brand/40 hover:bg-zinc-900 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-brand transition-all">
                    <History size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest italic">Vergangene Spiele</h4>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Alle Grafiken verwalten</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-zinc-700 group-hover:text-brand transition-all" />
              </button>

              {latestGame && (
                <Card 
                  className="p-10 rounded-[3rem] bg-zinc-900 border-white/10 space-y-8 shadow-2xl relative group hover:border-brand/40 transition-all cursor-pointer overflow-hidden" 
                  onClick={() => setSelectedGame(latestGame)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                      <Calendar size={12} /> Letztes Spiel
                    </span>
                    <Badge variant="brand" className="text-[9px]">Ergebnis</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-lg font-black text-white uppercase italic tracking-tighter truncate max-w-[150px]">
                        {getTeamName(latestGame, 'heim')}
                      </h5>
                      <span className="text-2xl font-black text-brand italic">{latestGame.score?.heim ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <h5 className="text-lg font-black text-white uppercase italic tracking-tighter truncate max-w-[150px]">
                        {getTeamName(latestGame, 'gegner')}
                      </h5>
                      <span className="text-2xl font-black text-white/40 italic">{latestGame.score?.gegner ?? 0}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-brand group-hover:translate-x-2 transition-all">
                    <span className="text-[10px] font-black uppercase">
                      {canManageSocial ? 'Grafik erstellen' : 'Details ansehen'}
                    </span>
                    <ArrowRight size={16} />
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isHistoryOpen && (
            <SocialHistoryModal 
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
              history={sortedHistory}
              onSelectGame={(game) => {
                setSelectedGame(game);
                setIsHistoryOpen(false);
              }}
            />
          )}

          {selectedGame && (
            <ResultPreviewModal 
              gameData={selectedGame} 
              onClose={() => setSelectedGame(null)} 
              onOpenEditor={() => {
                setGameForEditor(selectedGame);
                setSelectedGame(null);
              }}
            />
          )}

          {gameForEditor && (
            <ResultImageEditor 
              gameData={gameForEditor} 
              onClose={() => setGameForEditor(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </SubscriptionGuard>
  );
};

export default SocialHub;
