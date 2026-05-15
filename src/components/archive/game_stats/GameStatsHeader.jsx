import React from 'react';
import { ArrowLeft, Activity, Globe, RefreshCw, Video } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';

const GameStatsHeader = ({ 
  currentGame, 
  onBack, 
  onGoToVideo, 
  activeSubTab, 
  setActiveSubTab, 
  subTabs, 
  setIsSyncModalOpen 
}) => {
  const isHandballNet = currentGame.isSynced || currentGame.hnetGameId;

  return (
    <Card noPadding className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800">
      <div className="flex items-center gap-6">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          icon={ArrowLeft} 
          className="text-zinc-500 hover:text-zinc-100 pr-6 mr-2 border-r border-zinc-800 rounded-none h-10"
        >
          Zurück
        </Button>
        <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-800/50">
          {subTabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveSubTab(tab.id)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-zinc-100 text-black shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <tab.icon size={12} /> {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end mr-4">
          <div className="flex items-center gap-2">
            {currentGame.isSynced && !currentGame.hnetGameId?.startsWith('hnet_') ? (
              <Badge variant="brand" className="text-[9px] py-1">
                <Activity size={10} className="mr-1" /> Manuell (Abgeglichen)
              </Badge>
            ) : isHandballNet ? (
              <Badge variant="outline" className="text-[9px] py-1 text-blue-400 border-blue-400/20">
                <Globe size={10} className="mr-1" /> Handball.net
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] py-1 text-orange-400 border-orange-400/20">
                  <Activity size={10} className="mr-1" /> Manuell
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={RefreshCw} 
                  onClick={() => setIsSyncModalOpen(true)}
                  className="text-[9px] h-auto py-1 px-2 border border-zinc-800"
                >
                  Abgleich
                </Button>
              </div>
            )}
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">
            {new Date(currentGame.timestamp || currentGame.id).toLocaleDateString('de-DE')}
          </p>
        </div>
        <Button variant="primary" icon={Video} onClick={onGoToVideo}>
          Video Analyse
        </Button>
      </div>
    </Card>
  );
};

export default GameStatsHeader;
