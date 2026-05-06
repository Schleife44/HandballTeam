import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  PlayCircle, 
  BarChart2, 
  Settings,
  TrendingUp,
  History
} from 'lucide-react';
import useStore from '../../store/useStore';

export default function MobileNav() {
  const location = useLocation();
  const activeMatch = useStore(state => state.activeMatch);
  const isGameActive = activeMatch && activeMatch.timer?.phase !== 'PRE_GAME' && activeMatch.timer?.phase !== 'ENDED';

  const isInGame = location.pathname.startsWith('/game');
  const isInAnalytics = location.pathname.startsWith('/analytics');

  const items = [
    { icon: LayoutDashboard, label: 'Home', to: '/dashboard' },
    { icon: Calendar, label: 'Termine', to: '/calendar' },
    // Toggle Button Logic
    isGameActive 
      ? (isInGame 
          ? { icon: TrendingUp, label: 'Analyse', to: '/analytics' }
          : { icon: PlayCircle, label: 'Spiel', to: '/game' }
        )
      : { icon: PlayCircle, label: 'Spiel', to: '/game' },
    { icon: History, label: 'Archiv', to: '/history' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 px-4 flex items-center justify-around z-[100] lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 transition-colors
            ${isActive || (isGameActive && ((isInGame && item.label === 'Analyse') || (isInAnalytics && item.label === 'Spiel'))) ? 'text-brand' : 'text-zinc-500'}
          `}
        >
          <item.icon size={20} />
          <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
