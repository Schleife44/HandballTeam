import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { SyncBase } from './SyncBase';

export class MatchSync extends SyncBase {
  subscribeToMatch(teamId, store) {
    if (!teamId || !store) return;
    this._subscribe(`game_${teamId}`, doc(db, 'teams', teamId, 'games', 'current'), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (this.isMigrating) return;
      this.hydrateMatch(teamId, data, store);
    }, store);
  }

  hydrateMatch(teamId, data, store) {
    if (!store) return;

    if (data.score || data.timer || data.gameLog) {
      const ts = data.timer?.startTime;
      let parsedStartTime = null;
      if (ts) {
        if (typeof ts.toMillis === 'function') parsedStartTime = ts.toMillis();
        else if (typeof ts === 'number') parsedStartTime = ts;
        else if (ts.seconds) parsedStartTime = ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000;
        else if (ts instanceof Date) parsedStartTime = ts.getTime();
        else if (typeof ts === 'string') parsedStartTime = new Date(ts).getTime();
      }

      store.setMatchData?.({
        score: {
          home: data.score?.scoreHome || data.score?.home || data.score?.heim || 0,
          away: data.score?.scoreAway || data.score?.away || data.score?.gegner || 0,
        },
        gameLog: Array.isArray(data.gameLog) ? [...data.gameLog].sort((a, b) => {
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tB - tA; // Newest first
        }) : [],
        timer: {
          isRunning: data.timer?.isRunning ?? false,
          startTime: parsedStartTime,
          elapsedMs: (data.timer?.offsetSeconds || data.timer?.elapsedMs / 1000 || 0) * 1000,
          phase: this._getPhaseString(data.timer?.gamePhase || data.timer?.phase || 1, (data.timer?.offsetSeconds || data.timer?.elapsedMs / 1000 || 0) * 1000)
        },
        suspensions: data.activeSuspensions || data.suspensions || [],
        mode: data.mode || 'SIMPLE',
        isEmptyGoal: data.isEmptyGoal ?? false
      });
    }

    // Support for calendar settings stored in game current doc
    if (data.calendarSubscriptions || data.hiddenEventIds) {
      store.setSquadData?.({
        subscriptions: data.calendarSubscriptions || [],
        hiddenEventIds: data.hiddenEventIds || []
      });
    }

    store.setHydrated?.(true);
  }

  async saveMatch(teamId, matchState) {
    if (!teamId) return;
    if (!this._checkRateLimit('saveMatch')) return;

    try {
      const docRef = doc(db, 'teams', teamId, 'games', 'current');
      const payload = this._buildMatchPayload(matchState);
      await setDoc(docRef, this.stripFunctions(payload), { merge: true });
    } catch (e) {
      console.error('[Sync] saveMatch failed:', e);
    }
  }

  async recordAction(teamId, entry, matchState = null) {
    if (!teamId) return;
    if (!this._checkRateLimit('recordAction')) return;

    try {
      const docRef = doc(db, 'teams', teamId, 'games', 'current');
      const uniqueEntry = {
        ...entry,
        id: entry.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      };

      const updatePayload = {
        gameLog: arrayUnion(this.stripFunctions(uniqueEntry)),
        lastUpdated: serverTimestamp()
      };

      if (matchState) {
        const matchPayload = this._buildMatchPayload(matchState);
        Object.assign(updatePayload, matchPayload);
      }

      await setDoc(docRef, this.stripFunctions(updatePayload), { merge: true });
    } catch (e) {
      console.error('[Sync] recordAction failed:', e);
    }
  }

  async deleteCurrentMatch(teamId) {
    if (!teamId) return;
    try {
      await deleteDoc(doc(db, 'teams', teamId, 'games', 'current'));
    } catch (e) {
      console.error('[Sync] deleteCurrentMatch failed:', e);
    }
  }

  _buildMatchPayload(matchState) {
    const isRunning = !matchState.timer?.isPaused;
    const payload = {
      score: {
        heim: matchState.score?.home || 0,
        gegner: matchState.score?.away || 0
      },
      timer: {
        isRunning: isRunning,
        phase: this._getPhaseNumber(matchState.timer?.phase || 'PRE_GAME')
      },
      isEmptyGoal: !!matchState.isEmptyGoal,
      mode: matchState.mode || 'SIMPLE',
      activeSuspensions: matchState.suspensions || [],
      lastUpdated: serverTimestamp()
    };

    if (isRunning && !matchState.timer?.startTime) {
      payload.timer.startTime = serverTimestamp();
      payload.timer.offsetSeconds = (matchState.timer?.elapsedMs || 0) / 1000;
    } else if (!isRunning) {
      payload.timer.startTime = null;
      payload.timer.offsetSeconds = (matchState.timer?.elapsedMs || 0) / 1000;
    }
    return payload;
  }

  _getPhaseNumber(phase) {
    const map = { 'ENDED': 5, 'HALF_TIME': 3, 'PRE_GAME': 1, 'FIRST_HALF': 2, 'SECOND_HALF': 2 };
    return map[phase] || 2;
  }

  _getPhaseString(phaseNum, elapsedMs = 0) {
    const map = { 5: 'ENDED', 3: 'HALF_TIME', 1: 'PRE_GAME' };
    if (phaseNum === 2) {
      return (elapsedMs / 1000) < 1800 ? 'FIRST_HALF' : 'SECOND_HALF';
    }
    return map[phaseNum] || 'FIRST_HALF';
  }
}
