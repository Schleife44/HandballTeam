import { CoreSync } from './sync/CoreSync';
import { MatchSync } from './sync/MatchSync';
import { FineSync } from './sync/FineSync';
import { HistorySync } from './sync/HistorySync';
import { TacticsSync } from './sync/TacticsSync';
import { CalendarSync } from './sync/CalendarSync';

/**
 * SyncService V3.0 (Modular Facade)
 * Delegating domain-specific logic to sub-services for better maintainability.
 */
class SyncService {
  constructor() {
    this.core = new CoreSync();
    this.match = new MatchSync();
    this.fines = new FineSync();
    this.history = new HistorySync();
    this.tactics = new TacticsSync();
    this.calendar = new CalendarSync();

    // Link states for consistency if needed (though they manage their own maps)
    // For global stop/unsubscribe, we'll aggregate.
  }

  // --- Global Lifecycle ---
  stop() {
    this.core.stop();
    this.match.stop();
    this.fines.stop();
    this.history.stop();
    this.tactics.stop();
    this.calendar.stop();
  }

  // --- Subscriptions ---
  subscribeToCore(teamId, store) {
    this.core.subscribeToCore(teamId, store);
    this.match.subscribeToMatch(teamId, store); // Core usually triggers match sync too
    this.fines.subscribeToFines(teamId, store);
    this.calendar.subscribeToEvents(teamId, store);
    this.history.subscribeToHistory(teamId, store);
    this.tactics.subscribeToTactics(teamId, store);
  }

  subscribeToEvents(teamId, store) { return this.calendar.subscribeToEvents(teamId, store); }
  subscribeToRoster(teamId, store) { return this.core.subscribeToRoster(teamId, store); }
  subscribeToMembers(teamId, store) { return this.core.subscribeToMembers(teamId, store); }
  subscribeToFines(teamId, store) { return this.fines.subscribeToFines(teamId, store); }
  subscribeToTactics(teamId, store) { return this.tactics.subscribeToTactics(teamId, store); }
  unsubscribe(key) {
    this.core.unsubscribe(key);
    this.match.unsubscribe(key);
    this.fines.unsubscribe(key);
    this.calendar.unsubscribe(key);
    this.history.unsubscribe(key);
    this.tactics.unsubscribe(key);
  }

  // Backward compatibility methods (Proxying to domain services)
  
  // CORE
  async saveSettings(teamId, settings) { return this.core.saveSettings(teamId, settings); }
  async savePlayer(teamId, player, type) { return this.core.savePlayer(teamId, player, type); }
  async deletePlayer(teamId, id) { return this.core.deletePlayer(teamId, id); }

  // MATCH
  async saveMatch(teamId, state) { return this.match.saveMatch(teamId, state); }
  async recordAction(teamId, entry, state) { return this.match.recordAction(teamId, entry, state); }
  async deleteCurrentMatch(teamId) { return this.match.deleteCurrentMatch(teamId); }
  async addMatchLogEntry(teamId, entry) { 
    // Legacy support: Proxying to recordAction without state
    return this.match.recordAction(teamId, entry);
  }

  // FINES
  async saveFines(teamId, fines) { return this.fines.saveFines(teamId, fines); }
  async saveFineEntry(teamId, fine) { return this.fines.saveFineEntry(teamId, fine); }
  async saveBulkFineEntries(teamId, entries) { return this.fines.saveBulkFineEntries(teamId, entries); }
  async deleteFineEntry(teamId, id) { return this.fines.deleteFineEntry(teamId, id); }

  // HISTORY
  async saveHistoryGame(teamId, data) { return this.history.saveHistoryGame(teamId, data); }
  async deleteHistoryGame(teamId, id) { return this.history.deleteHistoryGame(teamId, id); }
  async fetchHistoryDetails(teamId, id) { return this.history.fetchHistoryDetails(teamId, id); }
  async saveSeasonData(teamId, season, data) { return this.history.saveSeasonData(teamId, season, data); }
  async fetchSeasonData(teamId, season) { return this.history.fetchSeasonData(teamId, season); }
  subscribeToHistory(teamId, store, limit, season) { return this.history.subscribeToHistory(teamId, store, limit, season); }

  // TACTICS
  async saveTacticsPlay(teamId, play) { return this.tactics.saveTacticsPlay(teamId, play); }
  async deleteTacticsPlay(teamId, id) { return this.tactics.deleteTacticsPlay(teamId, id); }

  // CALENDAR
  async saveEvent(teamId, event) { return this.calendar.saveEvent(teamId, event); }
  async deleteEvent(teamId, id) { return this.calendar.deleteEvent(teamId, id); }
  async saveBulkEvents(teamId, events) { return this.calendar.saveBulkEvents(teamId, events); }
  async deleteEventResponse(teamId, id, name) { return this.calendar.deleteEventResponse(teamId, id, name); }
  async saveHiddenEventIds(teamId, ids) { return this.calendar.saveHiddenEventIds(teamId, ids); }
  async saveSubscriptions(teamId, subs) { return this.calendar.saveSubscriptions(teamId, subs); }

  // UTILS
  stripFunctions(obj) { return this.core.stripFunctions(obj); }
}

const syncService = new SyncService();
export default syncService;
