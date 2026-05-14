import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Zap, Shield, ChevronRight, X } from 'lucide-react';
import Button from '../../ui/Button';

const GameModeSelector = ({ 
  isNeutralMode, 
  setIsNeutralMode, 
  showForeignModal, 
  setShowForeignModal, 
  foreignNames, 
  setForeignNames, 
  handleStartForeignGame, 
  initMatch, 
  squadSettings 
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 lg:p-6 space-y-12 lg:space-y-16 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic text-zinc-100">Spielmodus wählen</h2>
        <p className="text-zinc-500 text-xs lg:text-sm font-black uppercase tracking-[0.4em] opacity-50">Wie möchtest du das Spiel erfassen?</p>
        
        {/* NEUTRALER MODUS SELECTOR (Premium Redesign) */}
        <div className="flex items-center justify-center mt-12">
          <button 
            onClick={() => setIsNeutralMode(!isNeutralMode)}
            className={`group flex items-center gap-5 px-8 py-4 rounded-[2rem] border transition-all duration-500 active:scale-95 shadow-2xl ${isNeutralMode ? 'bg-indigo-500/10 border-indigo-500/40 shadow-indigo-500/10' : 'bg-zinc-900/40 border-zinc-800/60 backdrop-blur-2xl shadow-black/40'}`}
          >
            <div className={`p-2.5 rounded-xl transition-all duration-500 shadow-lg ${isNeutralMode ? 'bg-indigo-500 text-white scale-110 shadow-indigo-500/40' : 'bg-zinc-800 text-zinc-600'}`}>
              <Layers size={16} strokeWidth={2.5} />
            </div>
            
            <div className="flex flex-col items-start text-left min-w-[140px]">
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] transition-colors duration-500 ${isNeutralMode ? 'text-indigo-400' : 'text-zinc-400'}`}>
                Neutraler Modus
              </span>
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1 opacity-60">
                {isNeutralMode ? 'Aktiv (Fremde Teams)' : 'Deaktiviert (Eigener Kader)'}
              </span>
            </div>

            <div className={`w-12 h-6 rounded-full p-1.5 transition-all duration-500 relative ml-4 ${isNeutralMode ? 'bg-indigo-500/30' : 'bg-zinc-800/50'}`}>
              <div className={`w-3 h-3 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-500 ${isNeutralMode ? 'translate-x-6 bg-white' : 'translate-x-0 bg-zinc-600'}`} />
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 w-full max-w-5xl">
        {/* EINFACH MODE */}
        <button 
          onClick={() => isNeutralMode ? setShowForeignModal(true) : initMatch('SIMPLE', squadSettings.isZoneMode)} 
          className="group relative h-[300px] lg:h-[350px] bg-gradient-to-br from-brand/20 to-transparent border border-brand/20 rounded-[2.5rem] lg:rounded-[3.5rem] text-left p-8 lg:p-12 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand/10"
        >
          <motion.div 
            initial={{ x: 60, y: 60, scale: 0.8, opacity: 0, rotate: 20 }}
            animate={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 12 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="absolute -right-10 -bottom-10 text-brand/5 group-hover:text-brand/10 transition-all group-hover:rotate-6 group-hover:scale-110 duration-700 pointer-events-none"
          >
            <Zap size={280} fill="currentColor" />
          </motion.div>
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
              <span className="text-[10px] font-black uppercase text-brand tracking-[0.2em]">Ready for Action</span>
            </div>
            
            <h3 className="text-3xl lg:text-4xl font-black text-white uppercase italic mb-4 leading-none">Einfach</h3>
            <p className="text-sm font-bold text-zinc-500 uppercase leading-relaxed max-w-[240px] opacity-80 group-hover:opacity-100 transition-opacity">
              Direkte Erfassung ohne Bank-Management. Ideal für schnelles Tippen am Spielfeldrand.
            </p>

            <div className="mt-auto">
              <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-black rounded-full text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-all shadow-lg shadow-brand/20">
                Auswählen <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </button>

        {/* KOMPLEX MODE */}
        <button 
          onClick={() => initMatch('COMPLEX', squadSettings.isZoneMode)} 
          className="group relative h-[300px] lg:h-[350px] bg-gradient-to-br from-zinc-100/10 to-transparent border border-zinc-100/10 rounded-[2.5rem] lg:rounded-[3.5rem] text-left p-8 lg:p-12 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5"
        >
          <motion.div 
            initial={{ x: 60, y: 60, scale: 0.8, opacity: 0, rotate: 20 }}
            animate={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 12 }}
            transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.05 }}
            className="absolute -right-10 -bottom-10 text-zinc-100/5 group-hover:text-zinc-100/10 transition-all group-hover:rotate-6 group-hover:scale-110 duration-700 pointer-events-none"
          >
            <Shield size={280} fill="currentColor" />
          </motion.div>
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Expert Mode</span>
            </div>
            
            <h3 className="text-3xl lg:text-4xl font-black text-zinc-100 uppercase italic mb-4 leading-none">Komplex</h3>
            <p className="text-sm font-bold text-zinc-500 uppercase leading-relaxed max-w-[240px] opacity-80 group-hover:opacity-100 transition-opacity">
              Mit Aufstellung, Bank und Einsatzzeiten. Volle taktische Kontrolle für tiefe Analysen.
            </p>

            <div className="mt-auto">
              <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-100 text-black rounded-full text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-all shadow-lg shadow-white/10">
                Auswählen <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </button>

      </div>

      {/* Foreign Game Setup Modal */}
      <AnimatePresence>
        {showForeignModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForeignModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-zinc-900 border border-white/5 rounded-[3rem] p-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Teams festlegen</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Wer spielt gegen wen?</p>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setShowForeignModal(false)} 
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-zinc-400 transition-colors"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Heim-Mannschaft</label>
                  <input 
                    type="text"
                    value={foreignNames.home}
                    onChange={(e) => setForeignNames({ ...foreignNames, home: e.target.value })}
                    placeholder="Name Team A..."
                    className="w-full bg-black/40 border border-zinc-800 p-5 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Gast-Mannschaft</label>
                  <input 
                    type="text"
                    value={foreignNames.away}
                    onChange={(e) => setForeignNames({ ...foreignNames, away: e.target.value })}
                    placeholder="Name Team B..."
                    className="w-full bg-black/40 border border-zinc-800 p-5 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold"
                  />
                </div>

                <Button 
                  variant="primary"
                  size="xl"
                  onClick={handleStartForeignGame}
                  disabled={!foreignNames.home || !foreignNames.away}
                  className="w-full mt-4"
                >
                  Spiel Eröffnen
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameModeSelector;
