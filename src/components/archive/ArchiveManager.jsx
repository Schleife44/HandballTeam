import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { History, FolderOpen, Shield, Trophy } from 'lucide-react';

// Hooks
import { useArchiveData } from '../../hooks/useArchiveData';

// Tabs
import HistoryTab from './HistoryTab';
import VideoAnalysisTab from './VideoAnalysisTab';
import SeasonStatsTab from './SeasonStatsTab';
import LeagueTableTab from './LeagueTableTab';
import GameStatsTab from './GameStatsTab';

// Components
import SubscriptionGuard from '../auth/SubscriptionGuard';

const ArchiveManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    selectedGame, 
    isDetailLoading, 
    handleGameSelect 
  } = useArchiveData();

  const tabs = [
    { id: 'history', label: 'Spiele-Archiv', icon: History, path: '/history/list' },
    { id: 'stats', label: 'Saison-Statistiken', icon: Trophy, path: '/history/stats' },
    { id: 'table', label: 'Liga-Tabelle', icon: Shield, path: '/history/table' },
  ];

  const onGameClick = async (game, targetTab = 'game_stats') => {
    const loadedGame = await handleGameSelect(game);
    if (loadedGame) {
      if (targetTab === 'game_stats') {
        navigate('/history/game');
      } else {
        navigate('/history/video');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex-shrink-0">
            <FolderOpen size={20} className="text-blue-400" />
          </div>
          <div className="flex-shrink-0">
            <h2 className="text-xl font-black tracking-tighter uppercase italic text-zinc-100">Archiv</h2>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Vergangene Spiele & Analysen</p>
          </div>
        </div>

        <div className="flex p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-x-auto no-scrollbar whitespace-nowrap ml-auto">
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

      {/* Detail Loader Overlay */}
      {isDetailLoading && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-brand rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Analysedaten werden geladen...</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        <Routes>
          <Route path="/" element={<Navigate to="list" replace />} />
          <Route path="list" element={<HistoryTab onSelectGame={onGameClick} />} />
          
          <Route path="game" element={
            <GameStatsTab 
              game={selectedGame} 
              onBack={() => navigate('/history/list')} 
              onGoToVideo={() => navigate('/history/video')} 
            />
          } />

          <Route path="video" element={
            <SubscriptionGuard 
              title="Video-Analyse" 
              description="Schneide Spielszenen, erstelle Playlists und analysiere dein Team im Video. Nur im Pro-Paket verfügbar."
            >
              <VideoAnalysisTab initialGame={selectedGame} onBack={() => navigate('/history/list')} />
            </SubscriptionGuard>
          } />

          <Route path="stats" element={
            <SubscriptionGuard 
              title="Saison-Statistiken" 
              description="Behalte den Überblick über die gesamte Saison. Detaillierte Spieler-Analysen und Trends sind im Pro-Paket enthalten."
            >
              <SeasonStatsTab />
            </SubscriptionGuard>
          } />

          <Route path="table" element={
            <SubscriptionGuard 
              title="Liga-Tabelle" 
              description="Archiviere deine Tabellenstände. Der Endstand jeder Saison bleibt hier dauerhaft für dich gesichert."
            >
              <LeagueTableTab />
            </SubscriptionGuard>
          } />
        </Routes>
      </div>
    </div>
  );
};

export default ArchiveManager;
