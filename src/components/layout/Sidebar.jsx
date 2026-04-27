import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Users, 
  PlayCircle, 
  BarChart2, 
  Settings, 
  LogOut,
  ChevronRight,
  Layout,
  Euro,
  Share2,
  RefreshCw
} from 'lucide-react';
import useStore from '../../store/useStore';

function SidebarItem({ icon: Icon, label, to, badge, isSidebarOpen }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        w-full flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} px-3 py-2.5 rounded-xl transition-all duration-300 group
        ${isActive 
          ? 'bg-brand text-black font-bold shadow-[0_10px_25px_-5px_rgba(132,204,22,0.4)] scale-[1.02]' 
          : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50 hover:scale-[1.03]'}
      `}
    >
      {({ isActive }) => (
        <>
          <div className={`flex items-center ${isSidebarOpen ? 'gap-2.5' : ''}`}>
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`flex-shrink-0 transition-transform duration-300 ${!isActive && 'group-hover:scale-110'}`} />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -10, width: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-xs tracking-tight whitespace-nowrap overflow-hidden"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {badge && isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0
                  ${isActive ? 'bg-black text-brand' : 'bg-brand text-black shadow-[0_0_10px_rgba(132,204,22,0.3)]'}`}
              >
                {badge}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ isSidebarOpen }) {
  const { setActiveTeam, logout } = useStore();
  return (
    <aside className={`
      ${isSidebarOpen ? 'w-52' : 'w-20'} 
      bg-zinc-950 border-r border-zinc-900 transition-all duration-300 hidden lg:flex flex-col p-3 z-50
    `}>
      <div className={`flex items-center ${isSidebarOpen ? 'gap-2.5 px-2' : 'justify-center'} mb-8 group cursor-pointer`}>
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(132,204,22,0.3)] group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500">
          <span className="text-black font-black text-lg">6m</span>
        </div>
        {isSidebarOpen && (
          <span className="text-lg font-black tracking-tighter text-zinc-100 group-hover:text-brand transition-colors duration-300">Sechsmeter</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-2">
        <div className="pb-6">
           <AnimatePresence>
             {isSidebarOpen && (
               <motion.p 
                 initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                 animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                 exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] px-4 overflow-hidden"
               >
                 Main Menu
               </motion.p>
             )}
           </AnimatePresence>
           <SidebarItem 
            icon={LayoutDashboard} 
            label="Überblick" 
            to="/dashboard"
            isSidebarOpen={isSidebarOpen}
          />
           <SidebarItem 
            icon={CalendarIcon} 
            label="Kalender" 
            to="/calendar"
            isSidebarOpen={isSidebarOpen}
          />
           <SidebarItem 
            icon={Layout} 
            label="Taktikboard" 
            to="/tactics"
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        <div className="py-4 border-t border-zinc-900/50">
           <AnimatePresence>
             {isSidebarOpen && (
               <motion.p 
                 initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                 animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                 exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                 className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] px-4 overflow-hidden"
               >
                 Spieltag
               </motion.p>
             )}
           </AnimatePresence>
           <SidebarItem 
            icon={PlayCircle} 
            label="Spiel" 
            to="/game"
            badge="LIVE"
            isSidebarOpen={isSidebarOpen}
          />
            <SidebarItem 
             icon={BarChart2} 
             label="Live Analytics" 
             to="/analytics"
             isSidebarOpen={isSidebarOpen}
           />
           <SidebarItem 
            icon={Users} 
            label="Kader" 
            to="/roster"
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        <div className="py-6 border-t border-zinc-900/50">
           <div className="flex items-center justify-between pr-4">
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 px-4 whitespace-nowrap overflow-hidden"
                  >
                    Analytics
                  </motion.p>
                )}
              </AnimatePresence>
             {isSidebarOpen && <ChevronRight size={10} className="text-zinc-700 mb-4" />}
           </div>
           <SidebarItem 
            icon={BarChart2} 
            label="Archiv" 
            to="/history"
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        <div className="py-6 border-t border-zinc-900/50">
           <AnimatePresence>
             {isSidebarOpen && (
               <motion.p 
                 initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                 animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                 exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] px-4 overflow-hidden"
               >
                 System
               </motion.p>
             )}
           </AnimatePresence>
           <SidebarItem 
            icon={Share2} 
            label="Social Media" 
            to="/social"
            isSidebarOpen={isSidebarOpen}
          />
           <SidebarItem 
            icon={Euro} 
            label="Mannschaftskasse" 
            to="/fines"
            isSidebarOpen={isSidebarOpen}
          />
           <SidebarItem 
            icon={Settings} 
            label="Einstellungen" 
            to="/settings"
            isSidebarOpen={isSidebarOpen}
          />
        </div>
      </nav>

      <div className="pt-3 border-t border-zinc-900 space-y-1">
        <button 
          onClick={() => setActiveTeam(null)}
          className={`w-full flex items-center ${isSidebarOpen ? 'gap-2.5 px-4' : 'justify-center'} py-2.5 rounded-xl text-zinc-600 hover:text-brand hover:bg-zinc-800/50 hover:scale-[1.02] transition-all text-xs group`}
        >
          <RefreshCw size={18} className="transition-transform duration-700 group-hover:rotate-180" />
          {isSidebarOpen && <span className="font-bold">Team wechseln</span>}
        </button>
        <button 
          onClick={logout}
          className={`w-full flex items-center ${isSidebarOpen ? 'gap-2.5 px-4' : 'justify-center'} py-2.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 hover:scale-[1.02] transition-all text-xs group`}
        >
          <LogOut size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
          {isSidebarOpen && <span className="font-bold">Logout</span>}
        </button>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 10 }}
             className="mt-6 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between overflow-hidden"
           >
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-brand animate-pulse shadow-[0_0_8px_rgba(132,204,22,0.5)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Live</span>
             </div>
             <ChevronRight size={12} className="text-zinc-600" />
           </motion.div>
         )}
      </AnimatePresence>
    </aside>
  );
}
