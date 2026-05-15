import React, { useState, useEffect } from 'react';
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
import GameStatusIndicators from './parts/GameStatusIndicators';
import MatchLoadingScreen from './parts/MatchLoadingScreen';

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

  // Cleanup on unmount: Remove temporary players if no match is active
  useEffect(() => {
    return () => {
      const state = useStore.getState();
      if (!state.activeMatch) {
        const cleanHome = (state.squad.home || []).filter(p => !p.isTemporary);
        const cleanAway = (state.squad.away || []).filter(p => !p.isTemporary);
        state.setSquadData({ home: cleanHome, away: cleanAway });
      }
    };
  }, []);

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

  if (isAutoSetupLoading) return <MatchLoadingScreen />;

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
            
            <GameStatusIndicators 
              activeMatch={activeMatch}
              toggleEmptyGoal={toggleEmptyGoal}
              gameLogic={gameLogic}
            />

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

        {/* Sidebar Log */}
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
