import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { History, Video, BarChart2, FolderOpen } from 'lucide-react';
import HistoryTab from './HistoryTab';
import VideoAnalysisTab from './VideoAnalysisTab';
import SeasonStatsTab from './SeasonStatsTab';
import GameStatsTab from './GameStatsTab';
import useStore from '../../store/useStore';
import SubscriptionGuard from '../auth/SubscriptionGuard';

const ArchiveManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { history } = useStore();
  
  // We still need a way to pass the selected game between routes if we don't want to use IDs in URL yet.
  // For now, let's just use the store or state if we really have to, but since we are refactoring, 
  // maybe we should just use a simple state for 'selectedGame' in the parent or handle it via URL params.
  // Given the complexity, let's use a local state for the game but Router for the tabs.
  const [selectedGame, setSelectedGame] = React.useState(null);

  const tabs = [
    { id: 'history', label: 'Spiele-Archiv', icon: History, path: '/history/list' },
    { id: 'stats', label: 'Saison-Statistiken', icon: BarChart2, path: '/history/stats' },
  ];

  const activeTabId = tabs.find(t => location.pathname.startsWith(t.path))?.id || 'history';

  const handleGameSelect = (game, targetTab = 'game_stats') => {
    if (!game) return;
    
    // Normalize game data for sub-components (Legacy support)
    const normalizedGame = {
      ...game,
      gameLog: game.gameLog || game.log || []
    };
    
    setSelectedGame(normalizedGame);
    if (targetTab === 'game_stats') {
      navigate('/history/game');
    } else {
      navigate('/history/video');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <FolderOpen size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase italic text-zinc-100">Archiv</h2>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Vergangene Spiele & Analysen</p>
          </div>
        </div>

        <div className="flex p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-x-auto no-scrollbar whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] lg:text-xs font-black uppercase transition-all flex-shrink-0
                ${location.pathname.startsWith(tab.path) || (tab.id === 'history' && (location.pathname === '/history/game' || location.pathname === '/history/video'))
                  ? 'bg-zinc-800 text-zinc-100 shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[600px]">
        <Routes>
          <Route path="/" element={<Navigate to="list" replace />} />
          <Route path="list" element={<HistoryTab onSelectGame={handleGameSelect} />} />
          <Route path="game" element={
            <GameStatsTab 
              game={selectedGame} 
              onBack={() => navigate('/history/list')} 
              onGoToVideo={() => navigate('/history/video')} 
            />
          } />
          <Route path="video" element={
            <SubscriptionGuard title="Video-Analyse" description="Schneide Spielszenen, erstelle Playlists und analysiere dein Team im Video. Nur im Pro-Paket verfügbar.">
              <VideoAnalysisTab initialGame={selectedGame} onBack={() => navigate('/history/list')} />
            </SubscriptionGuard>
          } />
          <Route path="stats" element={
            <SubscriptionGuard title="Saison-Statistiken" description="Behalte den Überblick über die gesamte Saison. Detaillierte Spieler-Analysen und Trends sind im Pro-Paket enthalten.">
              <SeasonStatsTab />
            </SubscriptionGuard>
          } />
        </Routes>
      </div>
    </div>
  );
};

export default ArchiveManager;
