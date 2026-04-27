import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Image as ImageIcon, History, ArrowRight, Play, Camera, Trophy, Calendar, X, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultImageEditor from './ResultImageEditor';
import ResultPreviewModal from './ResultPreviewModal';
import useStore from '../../store/useStore';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

const SocialHub = () => {
  const navigate = useNavigate();
  const { history, activeMember, squad } = useStore();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameForEditor, setGameForEditor] = useState(null);

  // Permissions
  const myUid = activeMember?.uid || '';
  const isOwner = myUid === (squad?.ownerUid || '');
  const memberFunctions = Array.isArray(activeMember?.function) 
    ? activeMember.function 
    : (activeMember?.function ? [activeMember.function] : []);
  const isPressewart = memberFunctions.includes('pressewart');
  const canManageSocial = isOwner || isPressewart;

  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.date || a.timestamp);
    const dateB = new Date(b.date || b.timestamp);
    return dateB - dateA;
  });

  const latestGame = sortedHistory[0];

  const getTeamName = (game, type) => {
    if (type === 'heim') return game.settings?.teamNameHeim || game.teamNameHeim || 'Heim';
    return game.settings?.teamNameGegner || game.teamNameGegner || 'Gast';
  };

  return (
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
          {/* STUDIO CTA */}
          <div 
            onClick={() => canManageSocial ? setGameForEditor(latestGame || {}) : null}
            className={`group relative rounded-[3.5rem] overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-16 transition-all shadow-2xl
              ${canManageSocial ? 'hover:border-brand/40 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
          >
            <motion.div 
              initial={{ x: 60, y: 60, scale: 0.8, opacity: 0, rotate: 20 }}
              animate={{ x: 0, y: 0, scale: 1.1, opacity: 1, rotate: 12 }}
              transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.05 }}
              className={`absolute -right-10 -bottom-10 transition-all duration-700 pointer-events-none
                ${canManageSocial ? 'text-brand/5 group-hover:text-brand/10 group-hover:rotate-6 group-hover:scale-[1.15]' : 'text-zinc-800'}`}
            >
              <ImageIcon size={280} fill="currentColor" />
            </motion.div>

            <div className="relative z-10 space-y-10 max-w-lg">
              <div>
                <h2 className="text-6xl font-black text-white uppercase italic leading-[0.95] tracking-tighter">
                  Erstelle deine <br />
                  <span className={canManageSocial ? 'text-brand' : 'text-zinc-600'}>Match-Grafik</span>
                </h2>
                <p className="text-sm font-bold text-zinc-500 mt-6 leading-relaxed">
                  {canManageSocial 
                    ? 'Nutze das Premium-Studio, um professionelle Instagram-Beiträge mit deinem Team-Design zu generieren.'
                    : 'Nur der Pressewart oder der Super-Admin können Grafiken im Studio erstellen.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant={canManageSocial ? 'brand' : 'ghost'}
                  className="px-10 py-6 rounded-[2.5rem] text-sm group pointer-events-none"
                  disabled={!canManageSocial}
                >
                  <ImageIcon size={20} strokeWidth={3} className="mr-2 group-hover:scale-110 transition-transform" /> 
                  {canManageSocial ? 'Studio öffnen' : 'Zugriff verweigert'}
                </Button>
              </div>
            </div>
          </div>

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

          {/* Previous Games Button */}
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

            {/* Latest Game Card */}
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

      <AnimatePresence>
        {/* HISTORY SELECTOR MODAL */}
        {isHistoryOpen && (
          <Modal 
            isOpen={isHistoryOpen} 
            onClose={() => setIsHistoryOpen(false)}
            title="Spiel wählen"
            size="md"
          >
            <div className="max-h-[500px] overflow-y-auto space-y-3 no-scrollbar p-1">
              {sortedHistory.map((game, idx) => (
                <button
                  key={game.id || idx}
                  onClick={() => {
                    setSelectedGame(game);
                    setIsHistoryOpen(false);
                  }}
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
              {sortedHistory.length === 0 && (
                <div className="p-12 text-center text-zinc-500 uppercase font-black italic text-sm">
                  Keine Spiele im Archiv gefunden.
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* PREVIEW MODAL FOR SELECTED GAME */}
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

        {/* FULL EDITOR MODAL */}
        {gameForEditor && (
          <ResultImageEditor 
            gameData={gameForEditor} 
            onClose={() => setGameForEditor(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialHub;
