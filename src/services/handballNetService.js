/**
 * Handballnet Service - Modular Facade
 * Maintains the original API while delegating to sub-modules.
 */

// Re-export everything for backward compatibility
export { fetchWithProxy } from './hnet/hnetProxy';
export { 
  parseGameId, 
  normalizeAction, 
  mapToInternal,
  toSecs 
} from './hnet/hnetMapper';
export { 
  fetchGameData, 
  fetchTeamTable, 
  fetchTournamentSchedule, 
  fetchTeamSchedule 
} from './hnet/hnetFetcher';
export { 
  syncGame, 
  syncToCalendar,
  interpolateTimestamps 
} from './hnet/hnetSync';
