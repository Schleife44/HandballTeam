import React from 'react';
import { Users, Plus, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RosterHeader = ({ teamName, activeTab, onTabChange, onAddPlayer }) => (
  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-zinc-900/40 p-5 lg:p-6 rounded-3xl lg:rounded-[2.5rem] border border-zinc-800 backdrop-blur-xl overflow-hidden">
    <div className="flex items-center gap-4">
      <div className="p-4 bg-brand/10 border border-brand/20 rounded-3xl">
        <Users size={24} className="text-brand" />
      </div>
      <div>
        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-zinc-100">{teamName}</h2>
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Kader-Verwaltung</p>
      </div>
    </div>

    <motion.div layout className="flex items-center gap-3">
      <AnimatePresence mode="wait">
        {activeTab !== 'stats' ? (
          <motion.div 
            key="tabs"
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex p-1.5 bg-black/40 rounded-2xl border border-zinc-800"
          >
            <button 
              onClick={() => onTabChange('home')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase transition-all
                ${activeTab === 'home' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-100'}`}
            >
              Heim
            </button>
            <button 
              onClick={() => onTabChange('away')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase transition-all
                ${activeTab === 'away' ? 'bg-zinc-700 text-zinc-100 shadow-lg' : 'text-zinc-500 hover:text-zinc-100'}`}
            >
              Gast
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="stats-label"
            layout
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl"
          >
            <TrendingUp size={16} className="text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest text-nowrap">Analyse-Modus Aktiv</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="flex items-center gap-2 ml-4">
        <button 
          onClick={() => onTabChange(activeTab === 'stats' ? 'home' : 'stats')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg min-w-[140px] justify-center
            ${activeTab === 'stats' ? 'bg-zinc-100 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
        >
          {activeTab === 'stats' ? (
            <> <Users size={16} /> Kaderliste </>
          ) : (
            <> <TrendingUp size={16} /> Stats </>
          )}
        </button>

        <AnimatePresence>
          {onAddPlayer && activeTab !== 'stats' && (
            <motion.button 
              key="add-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onAddPlayer}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-black hover:bg-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95 whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={3} /> Spieler Hinzufügen
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  </div>
);

export default RosterHeader;
