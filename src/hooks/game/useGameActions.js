import { useState } from 'react';
import useStore from '../../store/useStore';

export const useGameActions = (activeMatch, squad, formatTime) => {
  const { 
    updateMatchLineup, 
    addMatchSuspension, 
    recordMatchAction,
    addToMatchLog,
    setActiveGoalkeeper
  } = useStore();

  const { home, away } = squad;

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeShotAction, setActiveShotAction] = useState(null);
  const [swapPending, setSwapPending] = useState(null);
  const [sevenMeterFlow, setSevenMeterFlow] = useState(null);
  const [foulFlow, setFoulFlow] = useState(null);

  const getActionLabel = (id) => {
    const labels = {
      'GOAL': 'Tor', 'MISS': 'Fehlwurf', 'SAVE': 'Gehalten', 'BLOCKED': 'Block',
      '7M_GOAL': '7m Tor', '7M_SAVE': '7m Gehalten', '7M_MISS': '7m Fehlwurf',
      'TWO_MIN': '2 Minuten', 'YELLOW': 'Gelbe Karte', 'RED': 'Rote Karte',
      'BLUE': 'Blaue Karte', 'GET_7M': '7m rausgeholt', 'GET_7M_2MIN': '7m + 2min rausgeholt'
    };
    return labels[id] ?? id;
  };

  const handleSetActiveGoalkeeper = (playerId) => {
    setActiveGoalkeeper(playerId);
  };

  const handleAction = (actionId, extraData = null) => {
    const playerToUse = selectedPlayer || activeShotAction?.player || sevenMeterFlow?.shooter;
    if (!playerToUse) return;

    if (actionId === 'GET_7M' || actionId === 'GET_7M_2MIN') {
      setSevenMeterFlow({ earner: playerToUse, step: 'opponent', type: actionId });
      setSelectedPlayer(null);
      return;
    }

    if (actionId === 'GET_2MIN') {
      setFoulFlow({ type: 'GET_2MIN', earner: playerToUse, step: 'opponent' });
      setSelectedPlayer(null);
      return;
    }

    const shotActions = ['GOAL', 'MISS', 'BLOCKED', 'SAVE', '7M_GOAL', '7M_SAVE', '7M_MISS'];
    if (shotActions.includes(actionId) && !extraData) {
      setActiveShotAction({ player: playerToUse, actionId });
      setSelectedPlayer(null);
      setSevenMeterFlow(null);
      return;
    }

    const finalIsHome = home?.some(p => p.id === playerToUse.id);
    let newScore = { ...activeMatch.score };
    let scoreUpdate = null;

    if (actionId === 'GOAL' || actionId === '7M_GOAL') {
      if (finalIsHome) newScore.home += 1;
      else newScore.away += 1;
      scoreUpdate = { home: newScore.home, away: newScore.away };
    }

    let enrichedDetails = actionId.startsWith('7M') ? { ...extraData, fieldPos: { x: 50, y: 35 } } : (extraData ? { ...extraData } : {});

    const activeGoalkeeperId = activeMatch.activeGoalkeeperId;
    const isShotOnOurGoal = (!finalIsHome && ['GOAL', 'MISS', 'BLOCKED', 'SAVE', '7M_GOAL', '7M_SAVE', '7M_MISS'].includes(actionId)) || 
                            (finalIsHome && ['SAVE', '7M_SAVE'].includes(actionId));

    if (isShotOnOurGoal && activeGoalkeeperId) {
      enrichedDetails.goalkeeperId = activeGoalkeeperId;
    }

    const newLogEntry = {
      timestamp: Math.floor(Date.now() / 1000),
      time: formatTime(activeMatch.timer.elapsedMs),
      matchTimeMs: activeMatch.timer.elapsedMs,
      type: actionId,
      isOpponent: !finalIsHome,
      playerId: playerToUse.id,
      playerNumber: playerToUse.number,
      playerName: playerToUse.name,
      team: finalIsHome ? 'home' : 'away',
      action: getActionLabel(actionId),
      score: `${newScore.home}:${newScore.away}`,
      details: Object.keys(enrichedDetails).length > 0 ? enrichedDetails : null,
      isEmptyGoal: activeMatch.isEmptyGoal && !finalIsHome
    };

    if (actionId === 'TWO_MIN') {
      addMatchSuspension({
        playerId: playerToUse.id,
        team: playerToUse.team,
        remainingSeconds: 120,
        playerNumber: playerToUse.number,
        playerName: playerToUse.name
      });
    }

    if (actionId === 'RED' || actionId === 'BLUE' || actionId === 'TWO_MIN') {
      const currentLineup = activeMatch.lineup[playerToUse.team] || [];
      updateMatchLineup(playerToUse.team, currentLineup.filter(id => id !== playerToUse.id));
    }

    recordMatchAction(newLogEntry, scoreUpdate);
    setSelectedPlayer(null);
    setActiveShotAction(null);
    setSevenMeterFlow(null);
  };

  const handlePlayerClick = (player) => {
    if (sevenMeterFlow?.step === 'shooter') {
      if (player.team !== sevenMeterFlow.earner.team) return;
      setSevenMeterFlow({ ...sevenMeterFlow, shooter: player, step: 'result' });
      return;
    }

    if (activeMatch.mode === 'SIMPLE') {
      setSelectedPlayer(player);
      return;
    }

    if (swapPending && swapPending.team === player.team) {
      const isFieldPlayer = activeMatch.lineup[player.team].includes(player.id);
      if (swapPending.isBench && isFieldPlayer) {
        const newLineup = activeMatch.lineup[player.team].filter(id => id !== player.id);
        newLineup.push(swapPending.id);
        updateMatchLineup(player.team, newLineup);
        setSwapPending(null);
        return;
      }
    }
    const isFieldPlayer = activeMatch.lineup[player.team].includes(player.id);
    if (isFieldPlayer) setSelectedPlayer(player);
    else setSwapPending({ ...player, isBench: true });
  };

  const handle7mOpponentSelected = (opp) => {
    const earnerLog = {
      timestamp: Math.floor(Date.now() / 1000),
      time: formatTime(activeMatch.timer.elapsedMs),
      matchTimeMs: activeMatch.timer.elapsedMs,
      type: sevenMeterFlow.type,
      playerNumber: sevenMeterFlow.earner.number,
      playerName: sevenMeterFlow.earner.name,
      team: sevenMeterFlow.earner.team,
      action: getActionLabel(sevenMeterFlow.type),
      score: `${activeMatch.score.home}:${activeMatch.score.away}`,
      details: { opponentId: opp.id, opponentNumber: opp.number }
    };
    addToMatchLog(earnerLog);

    if (sevenMeterFlow.type === 'GET_7M_2MIN') {
      const opponentTeam = sevenMeterFlow.earner.team === 'home' ? 'away' : 'home';
      addMatchSuspension({ playerId: opp.id, team: opponentTeam, remainingSeconds: 120, playerNumber: opp.number, playerName: opp.name });
      const currentLineup = activeMatch.lineup[opponentTeam] || [];
      updateMatchLineup(opponentTeam, currentLineup.filter(id => id !== opp.id));
    }

    setSevenMeterFlow({ ...sevenMeterFlow, opponent: opp, step: 'shooter' });
  };

  const handleFoulOpponentSelected = (opp) => {
    const earnerLog = {
      timestamp: Math.floor(Date.now() / 1000),
      time: formatTime(activeMatch.timer.elapsedMs),
      matchTimeMs: activeMatch.timer.elapsedMs,
      type: 'GET_2MIN',
      playerNumber: foulFlow.earner.number,
      playerName: foulFlow.earner.name,
      team: foulFlow.earner.team,
      action: '2 MIN+ rausgeholt',
      score: `${activeMatch.score.home}:${activeMatch.score.away}`,
      details: { opponentId: opp.id, opponentNumber: opp.number }
    };
    addToMatchLog(earnerLog);

    const opponentTeam = foulFlow.earner.team === 'home' ? 'away' : 'home';
    addMatchSuspension({ playerId: opp.id, team: opponentTeam, remainingSeconds: 120, playerNumber: opp.number, playerName: opp.name });
    const currentLineup = activeMatch.lineup[opponentTeam] || [];
    updateMatchLineup(opponentTeam, currentLineup.filter(id => id !== opp.id));

    setFoulFlow(null);
  };

  return {
    selectedPlayer, setSelectedPlayer,
    activeShotAction, setActiveShotAction,
    swapPending, setSwapPending,
    sevenMeterFlow, setSevenMeterFlow,
    foulFlow, setFoulFlow,
    handleAction,
    handlePlayerClick,
    handle7mOpponentSelected,
    handleFoulOpponentSelected,
    handleSetActiveGoalkeeper,
    getActionLabel
  };
};
