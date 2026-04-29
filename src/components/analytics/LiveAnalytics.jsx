import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart2, 
  Target, 
  Activity, 
  FileText, 
  TrendingUp
} from 'lucide-react';

import OverviewTab from './tabs/OverviewTab';
import ShotChartsTab from './tabs/ShotChartsTab';
import HeatmapTab from './tabs/HeatmapTab';
import ProtocolTab from './tabs/ProtocolTab';
import useStore from '../../store/useStore';
import SubscriptionGuard from '../auth/SubscriptionGuard';

const LiveAnalytics = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeMatch: matchData, squad: squadData } = useStore();

  if (!matchData || !matchData.log || matchData.log.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center border border-zinc-800 shadow-2xl shadow-brand/5">
          <Activity className="text-zinc-700" size={40} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase italic text-zinc-100">Keine Live-Daten</h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Starte ein Spiel, um Echtzeit-Analysen zu sehen</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-brand transition-all"
        >
          Daten aktualisieren
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: TrendingUp, path: '/analytics/overview' },
    { id: 'shots', label: 'Wurfbilder', icon: Target, path: '/analytics/shots' },
    { id: 'heatmap', label: 'Heatmap', icon: Activity, path: '/analytics/heatmap' },
    { id: 'protocol', label: 'Protokoll', icon: FileText, path: '/analytics/protocol' },
  ];

  const activeTabId = tabs.find(t => location.pathname === t.path)?.id || 'overview';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-brand/10 rounded-2xl text-brand border border-brand/20 shadow-lg shadow-brand/5">
            <BarChart2 size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-100">Live Analytics</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black text-brand uppercase tracking-widest">{matchData.score.home} : {matchData.score.away}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Echtzeit Analyse Aktiv</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-black/40 p-1.5 rounded-3xl border border-zinc-800/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                ${location.pathname === tab.path || (tab.id === 'overview' && location.pathname === '/analytics')
                  ? 'bg-zinc-100 text-black shadow-xl shadow-white/5' 
                  : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <tab.icon size={14} />
              <span className={location.pathname === tab.path ? 'block' : 'hidden lg:block'}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Content */}
      <div className="min-h-[600px]">
        <Routes>
          <Route path="/" element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewTab match={matchData} squad={squadData} />} />
          <Route path="shots" element={
            <SubscriptionGuard title="Wurfbild-Analyse" description="Analysiere Trefferquoten und Wurfpositionen im Detail. Nur im Pro-Paket verfügbar.">
              <ShotChartsTab match={matchData} squad={squadData} />
            </SubscriptionGuard>
          } />
          <Route path="heatmap" element={
            <SubscriptionGuard title="Taktische Heatmaps" description="Sieh genau, wo die Action auf dem Spielfeld stattfindet. Upgrade auf Pro für volle Heatmap-Power.">
              <HeatmapTab match={matchData} squad={squadData} />
            </SubscriptionGuard>
          } />
          <Route path="protocol" element={<ProtocolTab match={matchData} squad={squadData} />} />
        </Routes>
      </div>
    </div>
  );
};

export default LiveAnalytics;
