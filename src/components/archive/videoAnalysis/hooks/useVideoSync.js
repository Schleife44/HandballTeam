import { useMemo, useCallback } from 'react';
import { parseTime } from '../../../../utils/timeUtils';

/**
 * Custom Hook for Video <-> Match Time Synchronization
 */
export const useVideoSync = (videoOffsets, sortedLog = []) => {
  
  const getAbsTime = useCallback((entry) => {
    if (!entry) return 0;
    const base = parseTime(entry.officialTime || entry.time || "00:00");
    const shift = entry.manualShift || 0;
    const total = base + shift;
    
    // Normalize to absolute match time (0-3600)
    const isSecondHalf = entry.half === 2 || entry.period === 2 || (entry.half === undefined && entry.period === undefined && total > 1800);
    if (isSecondHalf && total < 1800) {
      return total + 1800;
    }
    return total;
  }, []);

  const getEstimatedVideoTime = useCallback((entryOrMatchSecs) => {
    if (!entryOrMatchSecs && entryOrMatchSecs !== 0) return null;
    
    const isEntry = typeof entryOrMatchSecs === 'object';
    if (isEntry && entryOrMatchSecs.videoTime != null) return entryOrMatchSecs.videoTime;

    const gameSecs = isEntry ? getAbsTime(entryOrMatchSecs) : entryOrMatchSecs;
    const h = gameSecs >= 1800 ? 2 : 1;

    const h1 = videoOffsets.h1 ?? 0;
    const h2 = videoOffsets.h2 ?? 0;

    // 1. Collect all valid anchors for this half
    const anchors = sortedLog
      .filter(e => e.videoTime !== undefined && e.videoTime !== null && getAbsTime(e) >= (h === 1 ? 0 : 1800) && getAbsTime(e) < (h === 1 ? 1800 : 3600))
      .sort((a, b) => getAbsTime(a) - getAbsTime(b));

    // 2. Define the start anchor (Halftime offset)
    const startAnchor = { 
      videoTime: h === 1 ? h1 : h2, 
      gameTime: h === 1 ? 0 : 1800,
      timestamp: (anchors.length > 0 && anchors[0].timestamp) ? anchors[0].timestamp - (getAbsTime(anchors[0]) - (h === 1 ? 0 : 1800)) * 1000 : null
    };

    let prev = startAnchor;
    let next = null;

    for (const a of anchors) {
      const aAbs = getAbsTime(a);
      if (aAbs <= gameSecs) {
        prev = { ...a, gameTime: aAbs };
      } else {
        next = { ...a, gameTime: aAbs };
        break;
      }
    }

    // 3. Interpolation Logic
    if (prev && next) {
      const matchDeltaTotal = next.gameTime - prev.gameTime;
      const videoDeltaTotal = next.videoTime - prev.videoTime;
      if (matchDeltaTotal > 0) {
        const progress = (gameSecs - prev.gameTime) / matchDeltaTotal;
        return prev.videoTime + (progress * videoDeltaTotal);
      }
    }

    // 4. Extrapolation Logic (Timestamp based if available)
    if (isEntry && entryOrMatchSecs.timestamp && prev.timestamp) {
      const msDelta = entryOrMatchSecs.timestamp - prev.timestamp;
      return prev.videoTime + (msDelta / 1000);
    }

    // Fallback: Linear offset from last anchor
    const deltaProtocol = gameSecs - prev.gameTime;
    return prev.videoTime + deltaProtocol;
  }, [videoOffsets, sortedLog, getAbsTime]);

  const calculateVirtualGameTime = useCallback((currentTime) => {
    const h1 = videoOffsets.h1 ?? 0;
    const h2 = videoOffsets.h2 ?? 0;
    const isVideoH2 = h2 > 0 && currentTime >= h2;

    let foundIndex = -1;
    for (let i = sortedLog.length - 1; i >= 0; i--) {
      const entry = sortedLog[i];
      const estV = getEstimatedVideoTime(entry);
      if (estV === null) continue;
      
      const entryAbs = getAbsTime(entry);
      const isEntryH2 = entryAbs >= 1800;
      
      if (isVideoH2 && !isEntryH2) continue;
      if (!isVideoH2 && isEntryH2) continue;

      if (currentTime >= estV - 4) { // Assuming 4s lead time as default or pass it as param
        foundIndex = i;
        break;
      }
    }

    let vTime = 0;
    const activeEntry = foundIndex !== -1 ? sortedLog[foundIndex] : null;
    
    if (activeEntry) {
      const gameSecs = getAbsTime(activeEntry);
      const estV = getEstimatedVideoTime(activeEntry);
      vTime = gameSecs + (currentTime - estV);
      
      if (gameSecs < 1800) {
        vTime = Math.min(1800, vTime);
      }
    } else {
      // Legacy fallback
      if (currentTime < h1) vTime = 0;
      else if (currentTime < h1 + 1800) vTime = currentTime - h1;
      else if (h2 > 0 && currentTime >= h2) vTime = 1800 + Math.min(1800, currentTime - h2);
      else vTime = 1800;
    }

    return {
      virtualGameTime: Math.max(0, Math.min(3600, vTime)),
      activeEntryIndex: foundIndex
    };
  }, [videoOffsets, sortedLog, getAbsTime, getEstimatedVideoTime]);

  return {
    getAbsTime,
    getEstimatedVideoTime,
    calculateVirtualGameTime
  };
};
