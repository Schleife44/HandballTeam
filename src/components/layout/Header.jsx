import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, Menu, LogOut } from 'lucide-react';
import useStore from '../../store/useStore';

export default function Header({ isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const { user, logout } = useStore();

  const getInitials = () => {
    if (!user) return '??';
    if (user.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    const titles = {
      dashboard: 'Überblick',
      calendar: 'Kalender',
      tactics: 'Taktikboard',
      game: 'Spieltag',
      analytics: 'Live Analytics',
      roster: 'Kader',
      history: 'Archiv',
      social: 'Social Media',
      fines: 'Mannschaftskasse',
      settings: 'Einstellungen'
    };
    return titles[path] || 'Sechsmeter';
  };

  return (
    <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-4 lg:px-8 sticky top-0 bg-black/80 backdrop-blur-md z-40">
      <div className="flex items-center gap-2 lg:gap-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 transition-colors hidden lg:block"
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
        <div className="lg:hidden w-8 h-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(132,204,22,0.3)] mr-2">
          <span className="text-black font-black text-sm">6m</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight uppercase italic">{getPageTitle()}</h1>
          <span className="bg-brand/10 text-brand text-[10px] px-2 py-0.5 rounded-full font-bold border border-brand/20 tracking-widest animate-pulse">S-25/26 - V2.1</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => logout()}
          className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 transition-colors flex items-center gap-2 group"
          title="Abmelden"
        >
          <LogOut size={18} className="group-hover:text-red-500 transition-colors" />
        </button>
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800" />
          <div className="w-8 h-8 rounded-full border-2 border-black bg-zinc-700" />
          <div className="w-8 h-8 rounded-full border-2 border-black bg-brand flex items-center justify-center text-[10px] font-bold text-black uppercase">
            {getInitials()}
          </div>
        </div>
      </div>
    </header>
  );
}
