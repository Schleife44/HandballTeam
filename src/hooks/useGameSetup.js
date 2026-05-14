import { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';

export function useGameSetup(locationState) {
  const { squad, updateSettings, setSquadData } = useStore();
  const [isAutoSetupLoading, setIsAutoSetupLoading] = useState(false);
  const setupProcessedRef = useRef(false);

  useEffect(() => {
    let state = locationState;
    
    // PROACTIVE AUTO-DETECTION: If no state is passed, check if there's a game TODAY in the calendar
    if (!state && squad.calendarEvents?.length > 0) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const todaysEvent = squad.calendarEvents.find(e => {
        if (!e.date) return false;
        const eventDate = e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10);
        return eventDate === todayStr && (e.type?.toUpperCase() === 'SPIEL' || e.type === 'game');
      });

      if (todaysEvent) {
        state = {
          hnetGameId: todaysEvent.hnetGameId || (todaysEvent.id?.includes('hnet_') ? todaysEvent.id.replace('hnet_', '') : null),
          opponent: (todaysEvent.title || "").includes('vs.') ? todaysEvent.title.split('vs. ')[1] : 
                    (todaysEvent.title || "").includes(' - ') ? todaysEvent.title.split(' - ')[1] : 
                    todaysEvent.title,
          responses: todaysEvent.responses || {}
        };
      }
    }

    // GUEST PLAYER INJECTION: Find players who said 'going' but aren't in the roster
    if (state?.responses && !setupProcessedRef.current) {
      const goingNames = Object.entries(state.responses)
        .filter(([_, r]) => r.status === 'going')
        .map(([name]) => name);
      
      const homeRoster = squad.home || [];
      const rosterNames = new Set(homeRoster.map(p => p.name?.trim().toLowerCase()));
      
      const deletedGuestNames = squad.settings?.deletedGuestNames || [];
      
      const guestPlayers = goingNames
        .filter(name => name && !rosterNames.has(name.trim().toLowerCase()) && !deletedGuestNames.includes(name.trim().toLowerCase()))
        .map((name, idx) => ({
          id: `guest_${name.replace(/\s+/g, '')}_${Date.now()}_${idx}`,
          name: name,
          number: 'G',
          isGuest: true,
          isTemporary: true,
          role: 'Gast'
        }));

      if (guestPlayers.length > 0) {
        console.log(`[useGameSetup] Injecting ${guestPlayers.length} guest players from attendance`);
        setSquadData({ home: [...homeRoster, ...guestPlayers] });
      }
      setupProcessedRef.current = true;
    }

    if (state?.hnetGameId && !setupProcessedRef.current) {
      setupProcessedRef.current = true;
      setIsAutoSetupLoading(true);
      
      const triggerSetup = async (gameId, opponentName) => {
        const { fetchGameData } = await import('../services/handballNetService');
        try {
          const raw = await fetchGameData(gameId);
          const homeTeam = raw.teams.home.name;
          const myTeamName = squad.settings.homeName || "";
          const isOpponentHome = homeTeam.toLowerCase().includes(myTeamName.toLowerCase()) ? false : true;
          const opponentRaw = isOpponentHome ? raw.teams.home : raw.teams.away;
          
          const opponentRoster = (opponentRaw.lineup || []).map(p => ({
            id: `opp_${p.number}`,
            number: String(p.number),
            name: p.name,
            isTemporary: true,
            team: 'away'
          }));

          updateSettings({ awayName: opponentRaw.name || opponentName });
          setSquadData({ away: opponentRoster });
          console.log(`[useGameSetup] Loaded ${opponentRoster.length} players for ${opponentRaw.name}`);
        } catch (err) {
          console.error("[useGameSetup] Error:", err);
        } finally {
          setIsAutoSetupLoading(false);
        }
      };

      // If we have an ID, start immediately
      if (state.hnetGameId && state.hnetGameId !== 'null') {
        triggerSetup(state.hnetGameId, state.opponent);
      } 
      // NEW: If no ID but we have a teamId, search the schedule!
      else if (squad.settings.teamId) {
        import('../services/handballNetService').then(async ({ fetchTeamSchedule }) => {
          try {
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            const schedule = await fetchTeamSchedule(squad.settings.teamId);
            
            // Find today's game in the schedule
            const gameToday = schedule.find(g => g.startsAt?.slice(0, 10) === todayStr);
            
            if (gameToday && gameToday.id) {
              console.log(`[useGameSetup] Found game ID ${gameToday.id} in schedule for today!`);
              triggerSetup(gameToday.id, state.opponent);
            } else {
              setIsAutoSetupLoading(false);
            }
          } catch (err) {
            console.error("[useGameSetup] Schedule search error:", err);
            setIsAutoSetupLoading(false);
          }
        });
      } else {
        setIsAutoSetupLoading(false);
      }
    }
  }, [locationState, squad.calendarEvents, squad.settings.homeName, updateSettings, setSquadData]);

  return { isAutoSetupLoading };
}
