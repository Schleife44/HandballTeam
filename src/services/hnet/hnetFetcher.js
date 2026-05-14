/**
 * Hnet API Fetcher
 */
import { fetchWithProxy } from './hnetProxy';

export const fetchGameData = async (gameId) => {
  const url = `https://www.handball.net/a/sportdata/1/games/${gameId}/combined`;
  return await fetchWithProxy(url, { json: true });
};

export const fetchTeamTable = async (teamId) => {
  const url = `https://www.handball.net/a/sportdata/1/widgets/team/${teamId}/table`;
  return await fetchWithProxy(url, { json: true });
};

export const fetchTournamentSchedule = async (tournamentId, dateFrom, dateTo, teamId = null) => {
  let url = `https://www.handball.net/a/sportdata/1/widgets/tournament/${tournamentId}/schedule?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  if (teamId) url += `&teamId=${teamId}`;
  
  console.log(`[Hnet] Fetching schedule: ${dateFrom} to ${dateTo} (Team: ${teamId})`);
  const data = await fetchWithProxy(url, { json: true });
  
  if (data && data.schedule && Array.isArray(data.schedule.data)) {
    return data.schedule.data;
  }
  return [];
};

export const fetchTeamSchedule = async (inputTeamId) => {
  let fullId = (inputTeamId || "").trim();
  if (fullId.includes('handball.net/mannschaften/')) {
    const match = fullId.match(/mannschaften\/([^/]+)/);
    if (match && match[1]) fullId = match[1];
  }
  const numericId = (fullId.match(/(\d+)$/) || [])[1] || fullId;
  
  let rawResponse = null;
  let response = null;

  // STAGE 1: Modern Slug-based Endpoint
  const url1 = `https://www.handball.net/a/sportdata/1/widgets/team/${fullId}/team-schedule?dateFrom=2025-07-01&dateTo=2026-06-30`;
  try {
    rawResponse = await fetchWithProxy(url1);
    response = rawResponse?.data || rawResponse;
  } catch (e) { console.warn("[Hnet] Stage 1 failed"); }

  // STAGE 2: Legacy Widget Endpoint
  if (!response?.schedule?.data) {
    const url2 = `https://www.handball.net/a/sportdata/1/widgets/schedule?teamId=${numericId}&dateFrom=2025-07-01&dateTo=2026-06-30`;
    try {
      rawResponse = await fetchWithProxy(url2);
      response = rawResponse?.data || rawResponse;
    } catch (e) { console.warn("[Hnet] Stage 2 failed"); }
  }

  // STAGE 3: Direct API
  if (!response?.schedule?.data) {
    const url3 = `https://www.handball.net/a/sportdata/1/widgets/schedule?teamId=${numericId}`;
    try {
      rawResponse = await fetchWithProxy(url3);
      response = rawResponse?.data || rawResponse;
    } catch (e) { console.warn("[Hnet] Stage 3 failed"); }
  }

  return response?.schedule?.data || [];
};
