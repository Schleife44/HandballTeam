import useStore from '../../store/useStore';
import { useGameTimer } from './useGameTimer';
import { useGameActions } from './useGameActions';

/**
 * Core hook for all live game interactions - Modular Facade
 */
export const useGameLogic = () => {
  const { activeMatch, squad } = useStore();

  // 1. Timer Logic
  const { formatTime } = useGameTimer(activeMatch);

  // 2. Action & Flow Logic
  const {
    selectedPlayer, setSelectedPlayer,
    activeShotAction, setActiveShotAction,
    swapPending, setSwapPending,
    sevenMeterFlow, setSevenMeterFlow,
    foulFlow, setFoulFlow,
    handleAction,
    handlePlayerClick,
    handle7mOpponentSelected,
    handleFoulOpponentSelected,
    getActionLabel
  } = useGameActions(activeMatch, squad, formatTime);

  return {
    // State
    selectedPlayer, setSelectedPlayer,
    activeShotAction, setActiveShotAction,
    swapPending, setSwapPending,
    sevenMeterFlow, setSevenMeterFlow,
    foulFlow, setFoulFlow,
    // Handlers
    handleAction,
    handlePlayerClick,
    handle7mOpponentSelected,
    handleFoulOpponentSelected,
    // Utils
    formatTime,
    getActionLabel,
  };
};
