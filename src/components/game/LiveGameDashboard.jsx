import React, { useState, useEffect } from 'react';
import { Zap, UserPlus, Target } from 'lucide-react';
import useStore from '../../store/useStore';
import { useLocation } from 'react-router-dom';
import { useGameSetup } from '../../hooks/useGameSetup';
import { useGameLogic } from '../../hooks/game/useGameLogic';

// Modular Components
import PlayerActionGrid from './parts/PlayerActionGrid';
import MatchLog from './parts/MatchLog';
import GameModeSelector from './parts/GameModeSelector';
import LiveGameHeader from './parts/LiveGameHeader';
import ActionOverlayManager from './parts/ActionOverlayManager';
import QuickAddModal from './parts/QuickAddModal';

const LiveGameDashboard = () => {
  const location = useLocation();
  const { activeMatch, toggleEmptyGoal, squad, initMatch, setSquadData, addPlayer } = useStore();

  const [showForeignModal, setShowForeignModal] = useState(false);
  const [foreignNames, setForeignNames] = useState({ home: '', away: '' });
  const [isNeutralMode, setIsNeutralMode] = useState(false);
  const [quickAdd, setQuickAdd] = useState({ show: false, team: 'home', number: '', name: '' });

  const { isAutoSetupLoading } = useGameSetup(location.state);
  const gameLogic = useGameLogic();

  const { home, away, settings: squadSettings = {} } = squad;

  useEffect(() => {
    return () => {
      const { activeMatch, squad, setSquadData } = useStore.getState();
      if (!activeMatch) {
        const cleanHome = (squad.home || []).filter(p => !p.isTemporary);
        const cleanAway = (squad.away || []).filter(p => !p.isTemporary);
        setSquadData({ home: cleanHome, away: cleanAway });
      }
    };
  }, [setSquadData]);

  const handleQuickAdd = () => {
    if (!quickAdd.number) return;
    const newPlayer = {
      id: `quick_${Date.now()}`,
      number: quickAdd.number,
      name: quickAdd.name || `Spieler #${quickAdd.number}`,
      team: quickAdd.team,
      isTemporary: true
    };
    addPlayer(quickAdd.team, newPlayer);
    setQuickAdd({ show: false, team: 'home', number: '', name: '' });
  };

  if (isAutoSetupLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
          <Zap size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Bereite Spiel vor</h2>
        </div>
      </div>
    );
  }

  if (!activeMatch) {
    return (
      <GameModeSelector 
        isNeutralMode={isNeutralMode} setIsNeutralMode={setIsNeutralMode}
        showForeignModal={showForeignModal} setShowForeignModal={setShowForeignModal}
        foreignNames={foreignNames} setForeignNames={setForeignNames}
        handleStartForeignGame={() => {
          initMatch('SIMPLE', squadSettings.isZoneMode, foreignNames.home, foreignNames.away);
          setShowForeignModal(false);
        }}
        initMatch={initMatch} squadSettings={squadSettings}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-10 pb-20 lg:pb-0 animate-in fade-in duration-500">
      <LiveGameHeader 
        activeMatch={activeMatch} 
        squadSettings={squadSettings} 
        formatTime={gameLogic.formatTime} 
      />

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="2xl:col-span-9">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-8 backdrop-blur-xl">
            <div className="hidden lg:flex items-center justify-between mb-8">
               {activeMatch.mode === 'COMPLEX' && (
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-all ${activeMatch.isEmptyGoal ? 'bg-red-500' : 'bg-zinc-800'}`} onClick={() => toggleEmptyGoal()}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${activeMatch.isEmptyGoal ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-zinc-100 tracking-wider">Leeres Tor</span>
                  </div>
               )}

                <div className="flex items-center gap-4">
                  {gameLogic.sevenMeterFlow?.step === 'shooter' && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-brand/20 border border-brand/40 rounded-2xl animate-pulse">
                      <Target size={14} className="text-brand" />
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest">7m Schützen wählen...</span>
                    </div>
                  )}
                  {gameLogic.swapPending && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-brand/10 border border-brand/20 rounded-2xl animate-pulse">
                      <UserPlus size={14} className="text-brand" />
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest">#{gameLogic.swapPending.number} einwechseln...</span>
                    </div>
                  )}
                </div>
            </div>

            <PlayerActionGrid 
              onPlayerSelect={gameLogic.handlePlayerClick} 
              lineup={activeMatch.lineup} 
              activeSwap={gameLogic.swapPending} 
              mode={activeMatch.mode} 
              suspensions={activeMatch.suspensions}
              activeMatch={activeMatch}
              onAddPlayer={(team) => setQuickAdd({ ...quickAdd, show: true, team })}
            />
          </div>
        </div>

        <div className="hidden lg:block 2xl:col-span-3 h-[700px]">
          <MatchLog log={activeMatch.gameLog} />
        </div>
      </div>

      <QuickAddModal 
        quickAdd={quickAdd} setQuickAdd={setQuickAdd} 
        activeMatch={activeMatch} handleQuickAdd={handleQuickAdd} 
      />

      <ActionOverlayManager 
        {...gameLogic} 
        home={home} away={away} squad={squad} squadSettings={squadSettings} 
      />
    </div>
  );
};

export default LiveGameDashboard;
