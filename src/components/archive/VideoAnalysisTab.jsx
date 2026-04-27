import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2,
  Search, Filter, Clock, Save, Trash2, ArrowLeft,
  CheckCircle, Video, List, Zap, Settings, Settings2, ChevronRight, Globe,
  Circle, Triangle, Square, Info, AlertTriangle, Volume2, Star
} from 'lucide-react';

// Store
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';

// Utils
import { formatiereZeit, parseTime } from '../../utils/timeUtils';

const CLIP_DURATION = 5;
const DEFAULT_LEAD_TIME = 4;

const VideoAnalysisTab = ({ initialGame, onBack }) => {
  const { squad, updateHistoryGame } = useStore();
  const [currentGame, setCurrentGame] = useState(initialGame);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoOffsets, setVideoOffsets] = useState(() => {
    return {
      h1: initialGame?.videoOffsets?.h1 ?? null,
      h2: initialGame?.videoOffsets?.h2 ?? null
    };
  });
  
  useEffect(() => {
    if (currentGame?.videoOffsets) {
      setVideoOffsets({
        h1: currentGame.videoOffsets.h1 ?? null,
        h2: currentGame.videoOffsets.h2 ?? null
      });
    }
  }, [currentGame?.id]);
  const [leadTime, setLeadTime] = useState(DEFAULT_LEAD_TIME);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterPlayer, setFilterPlayer] = useState('all');
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [autoplayIndex, setAutoplayIndex] = useState(-1);
  const [clipEndTime, setClipEndTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isEditingH1, setIsEditingH1] = useState(false);
  const [isEditingH2, setIsEditingH2] = useState(false);
  const [manualH1, setManualH1] = useState('');
  const [manualH2, setManualH2] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isAddingHighlight, setIsAddingHighlight] = useState(false);
  const [newHighlightName, setNewHighlightName] = useState('Taktisches Highlight');
  const [newHighlightPlayer, setNewHighlightPlayer] = useState('');
  const [hideAdministrative, setHideAdministrative] = useState(true);
  const [syncFollow, setSyncFollow] = useState(true);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncUrl, setSyncUrl] = useState('');
  const [syncStatus, setSyncStatus] = useState({ type: '', message: '' });
  const [notification, setNotification] = useState(null);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const protocolListRef = useRef(null);
  const overlayTimeoutRef = useRef(null);

  // Auto-hide play overlay
  useEffect(() => {
    if (videoUrl) {
      setShowPlayOverlay(true);
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
      overlayTimeoutRef.current = setTimeout(() => setShowPlayOverlay(false), 1000);
    }
    return () => { if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current); };
  }, [isPlaying, videoUrl]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const getSecs = (str) => {
    if (!str) return 0;
    const pts = str.split(':');
    if (pts.length === 2) {
      return (parseInt(pts[0]) || 0) * 60 + (parseInt(pts[1]) || 0);
    }
    return 0;
  };

  // Sync offsets when game changes
  useEffect(() => {
    if (initialGame) {
      setCurrentGame(initialGame);
      let offsets = initialGame.videoOffsets || { h1: null, h2: null };
      if (offsets.h1 === 0 && offsets.h2 === 0) {
        offsets = { h1: null, h2: null };
      }
      setVideoOffsets(offsets);
    }
  }, [initialGame]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const setHalfOffset = (half) => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    const newOffsets = { ...videoOffsets, [half === 1 ? 'h1' : 'h2']: time };
    setVideoOffsets(newOffsets);
    
    if (currentGame) {
      const updatedGame = { ...currentGame, videoOffsets: newOffsets };
      setCurrentGame(updatedGame);
      updateHistoryGame(updatedGame);
    }

    setNotification({
      title: `Spielstart H${half} gesetzt`,
      message: `Position: ${formatiereZeit(time)}`,
      type: 'success'
    });
  };

  const jumpToOffset = (half) => {
    const offset = half === 1 ? videoOffsets.h1 : videoOffsets.h2;
    if (offset !== null && videoRef.current) {
      videoRef.current.currentTime = offset;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const getAbsTime = (entry) => {
    if (!entry) return 0;
    const base = parseTime(entry.officialTime || entry.time || "00:00");
    const shift = entry.manualShift || 0;
    const total = base + shift;
    
    // Normalize to absolute match time (0-3600)
    const isSecondHalf = entry.half === 2 || entry.period === 2 || (entry.half === undefined && entry.period === undefined && total > 1800);
    if (isSecondHalf && total < 1800) {
      return total + 1800;
    }
    if (!isSecondHalf && total > 1800) {
      return total; // Keep it as is if it's already absolute
    }
    return total;
  };

  const getEstimatedVideoTime = (entryOrMatchSecs) => {
    if (!entryOrMatchSecs && entryOrMatchSecs !== 0) return null;
    
    // Support both entry objects and raw seconds (for timeline clicks)
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

    // Find surrounding anchors
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

    // 3. Interpolation Logic (between two hard anchors)
    if (prev && next) {
      const matchDeltaTotal = next.gameTime - prev.gameTime;
      const videoDeltaTotal = next.videoTime - prev.videoTime;
      if (matchDeltaTotal > 0) {
        const progress = (gameSecs - prev.gameTime) / matchDeltaTotal;
        return prev.videoTime + (progress * videoDeltaTotal);
      }
    }

    // 4. Extrapolation Logic (using the closest previous anchor)
    // High Precision: Unix Timestamp based (only if we have timestamps)
    if (isEntry && entryOrMatchSecs.timestamp && prev.timestamp) {
      const msDelta = entryOrMatchSecs.timestamp - prev.timestamp;
      return prev.videoTime + (msDelta / 1000);
    }

    // Fallback: Linear offset from last anchor
    const deltaProtocol = gameSecs - prev.gameTime;
    return prev.videoTime + deltaProtocol;
  };

  const seekToEntry = (entry) => {
    if (!videoRef.current) return;
    const estimated = getEstimatedVideoTime(entry);
    const targetTime = estimated - leadTime;
    videoRef.current.currentTime = Math.max(0, targetTime);
    videoRef.current.play();
    setIsPlaying(true);

    const targetIdx = sortedLog.findIndex(e => e.timestamp === entry.timestamp);
    if (targetIdx !== -1 && protocolListRef.current) {
      const element = protocolListRef.current.children[targetIdx];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const getMarkerInfo = (entry) => {
    const action = (entry.action || '').toLowerCase();
    const isGegner = !!entry.gegnerNummer;
    
    if (action.includes('tor')) return { icon: Circle, color: '#84cc16', type: 'goal', isGegner };
    if (action.includes('fehlwurf') || action.includes('pfosten') || action.includes('latte') || action.includes('gehalten')) return { icon: Circle, color: '#ef4444', type: 'miss', isGegner };
    if (action.includes('minuten')) return { icon: Triangle, color: '#eab308', type: 'penalty', isGegner };
    if (action.includes('gelb') || action.includes('rot') || action.includes('karte') || action.includes('verwarnung')) return { icon: Square, color: '#f97316', type: 'card', isGegner };
    if (action.includes('timeout')) return { icon: Play, color: '#3b82f6', type: 'timeout', isGegner };
    
    return { icon: Info, color: '#94a3b8', type: 'other', isGegner };
  };

  const [editingIndex, setEditingIndex] = useState(-1);
  const [editGameTime, setEditGameTime] = useState('');
  const [editVideoTime, setEditVideoTime] = useState('');

  const handleEditEntry = (idx, entry) => {
    setEditingIndex(idx);
    setEditGameTime(entry.time || '00:00');
    setEditVideoTime(formatiereZeit(getEstimatedVideoTime(entry)));
  };

  const handleSaveEdit = async () => {
    if (editingIndex === -1) return;
    const entry = sortedLog[editingIndex];
    const logToUse = currentGame?.gameLog || currentGame?.log || [];
    if (logToUse.length === 0) return;
    
    const newLog = [...logToUse];
    const originalIdx = newLog.findIndex(e => e.timestamp === entry.timestamp);
    
    if (originalIdx !== -1) {
      const updatedEntry = { ...newLog[originalIdx] };
      updatedEntry.time = editGameTime;
      updatedEntry.manualShift = 0;
      updatedEntry.half = (parseTime(editGameTime) > 1800) ? 2 : 1;
      
      const newVTime = parseTime(editVideoTime);
      updatedEntry.videoTime = newVTime;

      newLog[originalIdx] = updatedEntry;
      const updatedGame = { ...currentGame, gameLog: newLog };
      
      setCurrentGame(updatedGame);
      updateHistoryGame(updatedGame);
      
      setNotification({ title: 'Gespeichert', message: 'Ereignis wurde aktualisiert.', type: 'success' });
    }
    setEditingIndex(-1);
  };

  const quickSyncEntry = (entry) => {
    if (!videoRef.current) return;
    const vTime = videoRef.current.currentTime;
    
    const logToUse = currentGame?.gameLog || currentGame?.log || [];
    const originalIdx = logToUse.findIndex(e => e.timestamp === entry.timestamp);
    
    if (originalIdx !== -1) {
      const newLog = [...logToUse];
      if (newLog[originalIdx].videoTime !== undefined && newLog[originalIdx].videoTime !== null) {
        newLog[originalIdx] = { ...newLog[originalIdx], videoTime: null };
        setNotification({ title: 'Sync entfernt', message: 'Ereignis folgt nun wieder der Halbzeit.', type: 'info' });
      } else {
        newLog[originalIdx] = { ...newLog[originalIdx], videoTime: vTime };
        setNotification({ title: 'Sync Erfolg', message: `Video-Zeit ${formatiereZeit(vTime)} zugewiesen.`, type: 'success' });
      }
      const updatedGame = { ...currentGame, gameLog: newLog };
      setCurrentGame(updatedGame);
      updateHistoryGame(updatedGame);
    }
  };

  const handleSync = async () => {
    if (!syncUrl) return;
    const { syncGame } = await import('../../services/handballNetService');
    setSyncStatus({ type: 'loading', message: 'Synchronisiere Daten...' });
    try {
      let myTeamName = squad.settings?.homeName || "Mein Team";

      const synced = await syncGame(currentGame, syncUrl, myTeamName);
      setCurrentGame(synced);
      updateHistoryGame(synced);
      setSyncStatus({ type: 'success', message: 'Erfolgreich synchronisiert!' });
      setTimeout(() => {
        setIsSyncModalOpen(false);
        setSyncUrl('');
        setSyncStatus({ type: '', message: '' });
      }, 1500);
    } catch (e) {
      console.error(e);
      setSyncStatus({ type: 'error', message: 'Fehler: ' + e.message });
    }
  };

  const [activeEntryIndex, setActiveEntryIndex] = useState(-1);
  const [virtualGameTime, setVirtualGameTime] = useState(0);

  const filteredLog = useMemo(() => {
    if (!currentGame) return [];
    const logToUse = currentGame.gameLog || currentGame.log || [];
    if (logToUse.length === 0) return [];
    return logToUse.filter(entry => {
      const term = searchTerm.toLowerCase().trim();
      
      let matchSearch = true;
      if (term) {
        const searchPool = [
          String(entry.playerName || ''),
          String(entry.playerId || ''),
          `spieler #${entry.playerId}`,
          String(entry.gegnerNummer || ''),
          `gegner #${entry.gegnerNummer}`,
          String(entry.action || '')
        ].map(v => v.toLowerCase().trim());
        matchSearch = searchPool.some(val => val.includes(term));
      }

      const actionLower = (entry.action || '').toLowerCase();
      const isGoal = actionLower.includes('tor');
      const isOpponent = entry.isOpponent === true || actionLower.includes('gegner');

      let matchAction = true;
      if (filterAction === 'all') {
        matchAction = true;
      } else if (filterAction === 'important') {
        matchAction = !!entry.isImportant;
      } else if (filterAction === 'all_goals') {
        matchAction = isGoal;
      } else if (filterAction === 'home_goals') {
        matchAction = isGoal && !isOpponent;
      } else if (filterAction === 'away_goals') {
        matchAction = isGoal && isOpponent;
      } else {
        matchAction = entry.action === filterAction;
      }
      
      let pId = String(entry.playerId ?? entry.playerNumber ?? entry.gegnerNummer ?? entry.number ?? entry.player ?? "");
      const matchPlayer = filterPlayer === 'all' || pId === String(filterPlayer);

      if (hideAdministrative) {
        const actionText = (entry.action || '').toLowerCase();
        const adminTerms = ['halbzeit', 'spielende', 'start', 'period', 'pause', 'beginn', 'stopp', 'vorbeiting'];
        if (adminTerms.some(term => actionText.includes(term))) return false;
        
        const isGenericPlayer = !entry.playerName || entry.playerName.includes('Spieler #') || entry.playerName.includes('Gegner #');
        if ((entry.time === '00:00' || entry.time === '30:00') && isGenericPlayer && !actionText.includes('tor') && !actionText.includes('minuten') && !actionText.includes('verwarnung')) {
          return false;
        }
      }
      
      return matchSearch && matchAction && matchPlayer;
    });
  }, [currentGame, searchTerm, filterAction, filterPlayer, hideAdministrative]);

  const sortedLog = useMemo(() => {
    return [...filteredLog].sort((a, b) => {
      return getAbsTime(a) - getAbsTime(b);
    });
  }, [filteredLog]);

  const uniqueActions = useMemo(() => {
    if (!currentGame || !currentGame.gameLog) return [];
    const forbidden = ['halbzeit', 'spielende', 'timeout', 'anwurf', 'pause', 'stopp', 'beginn', 'start'];
    return Array.from(new Set(currentGame.gameLog.map(e => e.action)))
      .filter(a => a && !forbidden.some(f => a.toLowerCase().includes(f)))
      .sort();
  }, [currentGame]);

  // Sync Protocol with Video & Virtual Game Time
  useEffect(() => {
    if (!videoRef.current || !currentGame || sortedLog.length === 0) return;

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
      
      // Only match entries from the current video half to prevent jumps (e.g. 3m -> 33m)
      if (isVideoH2 && !isEntryH2) continue; // In H2 video, but entry is H1? Skip.
      if (!isVideoH2 && isEntryH2) continue; // In H1 video, but entry is H2? Skip.

      if (currentTime >= estV - leadTime - 0.1) {
        foundIndex = i;
        break;
      }
    }
    
    if (foundIndex !== activeEntryIndex) {
      setActiveEntryIndex(foundIndex);
      if (syncFollow && foundIndex !== -1 && protocolListRef.current) {
        const element = protocolListRef.current.children[foundIndex];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }


    let vTime = 0;
    const activeEntry = foundIndex !== -1 ? sortedLog[foundIndex] : null;
    
    if (activeEntry) {
      const gameSecs = getAbsTime(activeEntry);
      const activeH = (activeEntry.half === 2 || activeEntry.period === 2 || gameSecs >= 1800) ? 2 : 1;
      
      if (activeH === 1 && h2 > 0 && currentTime >= h2) {
         // We are in H2 video time, but the last passed event was in H1.
         // Do not extrapolate H1 across the halftime break.
         vTime = 1800 + Math.min(1800, currentTime - h2);
      } else {
         const estV = getEstimatedVideoTime(activeEntry);
         vTime = gameSecs + (currentTime - estV);
         
         // Cap H1 events at 1800 (Halftime) so the clock doesn't run during the break
         if (activeH === 1) {
            vTime = Math.min(1800, vTime);
         }
      }
    } else {
      // Legacy fallback logic
      if (currentTime < h1) {
        vTime = 0;
      } else if (currentTime < h1 + 1800) {
        vTime = currentTime - h1;
      } else if (h2 > 0 && currentTime >= h2) {
        vTime = 1800 + Math.min(1800, currentTime - h2);
      } else {
        vTime = 1800;
      }
    }
    setVirtualGameTime(Math.max(0, Math.min(3600, vTime)));

  }, [currentTime, currentGame, sortedLog, syncFollow, videoOffsets]);

  useEffect(() => {
    if (isAutoplayActive && isPlaying && currentTime >= clipEndTime) {
      const nextIndex = autoplayIndex + 1;
      if (nextIndex < sortedLog.length) {
        const nextEntry = sortedLog[nextIndex];
        const nextTarget = getEstimatedVideoTime(nextEntry) - leadTime;
        
        // Overlap Detection: If the next clip starts very soon or has already passed 
        // while we were watching the previous one, don't jump back. Just extend.
        const isOverlap = nextTarget < currentTime + 2; 

        setAutoplayIndex(nextIndex);
        
        if (isOverlap) {
          // Seamless transition: just set the new end time
          setClipEndTime(nextTarget + leadTime + CLIP_DURATION);
          // console.log("[Autoplay] Seamless transition to clip", nextIndex);
        } else {
          // Hard jump: the next clip is further away
          videoRef.current.currentTime = Math.max(0, nextTarget);
          setClipEndTime(nextTarget + leadTime + CLIP_DURATION);
          // console.log("[Autoplay] Jumping to clip", nextIndex);
        }
      } else {
        setIsAutoplayActive(false);
        setAutoplayIndex(-1);
      }
    }
  }, [currentTime, isAutoplayActive, isPlaying, clipEndTime, autoplayIndex, sortedLog, leadTime]);

  const startAutoplay = () => {
    if (sortedLog.length === 0) return;
    setIsAutoplayActive(true);
    setAutoplayIndex(0);
    const firstEntry = sortedLog[0];
    const target = getEstimatedVideoTime(firstEntry) - leadTime;
    videoRef.current.currentTime = Math.max(0, target);
    setClipEndTime(target + leadTime + CLIP_DURATION);
    videoRef.current.play();
    setIsPlaying(true);
  };

  useEffect(() => {
    if (syncFollow && activeEntryIndex !== -1 && protocolListRef.current) {
      const activeEl = protocolListRef.current.children[0]?.children[activeEntryIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeEntryIndex, syncFollow]);

  return (
    <>
      <div className={`transition-all duration-700 ${isCinemaMode ? 'h-0 opacity-0' : 'h-[calc(100vh-250px)] min-h-[400px] -mt-4 mb-4'}`} />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
        className={`fixed transition-all duration-700 ease-in-out z-[9999] flex flex-col overflow-hidden border
          ${isCinemaMode 
            ? 'inset-0 p-8 border-transparent shadow-none bg-black' 
            : 'top-[220px] left-[280px] right-6 bottom-6 p-4 rounded-[32px] border-white/5 shadow-2xl bg-zinc-950'
          }
        `}
      >
        <div className={`flex items-center justify-between bg-zinc-900/60 backdrop-blur-md p-2 px-4 rounded-2xl border border-white/5 flex-shrink-0 transition-all duration-700
          ${isCinemaMode ? 'mb-4 py-3 px-6' : 'mb-2'}
        `}>
          <div className="flex items-center gap-3">
            {onBack && !isCinemaMode && (
              <Button 
                variant="ghost" 
                size="icon" 
                icon={ArrowLeft} 
                onClick={onBack}
                className="text-zinc-500 hover:text-zinc-100 mr-2 border-r border-white/5 rounded-none pr-4 h-8"
              />
            )}
            <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center border border-brand/20">
              <Video className="text-brand" size={16} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Badge variant="brand" className="text-[6px] py-0.5">Pro Analysis</Badge>
                <h1 className={`${isCinemaMode ? 'text-xl' : 'text-sm'} font-black uppercase italic text-zinc-100 tracking-tight transition-all`}>
                  {currentGame ? `${currentGame.settings?.teamNameHeim || 'Heim'} vs ${currentGame.settings?.teamNameGegner || 'Gast'}` : 'Video Analyse'}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCinemaMode && <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mr-2">{currentGame ? new Date(currentGame.timestamp || currentGame.id).toLocaleDateString('de-DE') : ''}</span>}
            <Button 
              variant={isCinemaMode ? "destructive" : "ghost"} 
              size="sm"
              icon={isCinemaMode ? Minimize2 : Maximize2}
              onClick={() => setIsCinemaMode(!isCinemaMode)}
              className="text-[9px]"
            >
              {isCinemaMode ? 'Beenden' : 'Cinema Mode'}
            </Button>
          </div>
        </div>

        <div className="flex flex-row gap-6 flex-1 min-h-0">
          <div className={`flex flex-col gap-4 min-h-0 transition-all duration-700 ease-in-out
            ${isCinemaMode ? (isFocusMode ? 'w-[88%]' : 'w-[72%]') : 'w-[65%] flex-grow'}
          `}>
            <div className={`relative flex-1 bg-zinc-950 overflow-hidden border border-white/5 shadow-2xl group min-h-0 transition-all duration-700 ${isCinemaMode ? 'rounded-[40px]' : 'rounded-[32px]'}`}>
              {videoUrl ? (
                <video 
                  ref={videoRef}
                  src={videoUrl}
                  onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.target.duration)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={() => isPlaying ? videoRef.current.pause() : videoRef.current.play()}
                  className="w-full h-full cursor-pointer object-contain"
                />
              ) : (
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/[0.01] transition-all border-2 border-dashed border-white/5 m-4 rounded-[24px]"
                >
                  <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20">
                    <Video size={24} className="text-brand" />
                  </div>
                  <p className="text-xs font-black uppercase text-zinc-500 italic">Load Tactical Source</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />
              
              <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 ease-out
                ${showPlayOverlay ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}
              `}>
                <div className="w-20 h-20 bg-brand/80 rounded-full flex items-center justify-center text-black shadow-[0_0_50px_rgba(132,204,22,0.5)]">
                  {!isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </div>
              </div>
            </div>

            <Card noPadding className={`backdrop-blur-xl border border-white/5 rounded-[32px] flex flex-col shadow-2xl flex-shrink-0 transition-all duration-700 ease-in-out
              ${isFocusMode ? 'p-2 gap-2 mt-auto' : 'p-4 gap-4'}
            `}>
              <div className="relative">
                <div className={`absolute left-2 right-2 flex justify-between items-center z-50 pointer-events-none transition-all
                  ${isFocusMode ? '-top-6' : '-top-1'}
                `}>
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 shadow-lg">
                    <span className="text-[7px] font-black uppercase tracking-widest text-brand">Match</span>
                    <span className="text-[11px] font-black text-zinc-100 tabular-nums italic">{formatiereZeit(virtualGameTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 shadow-lg">
                    <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
                    <span className="text-[10px] font-mono text-zinc-300 tracking-tighter tabular-nums">
                      {formatiereZeit(currentTime)} <span className="text-zinc-700">/</span> {formatiereZeit(duration)}
                    </span>
                  </div>
                </div>

                <div 
                  className={`relative bg-zinc-950/80 rounded-2xl border border-white/5 cursor-crosshair group transition-all
                    ${isFocusMode ? 'h-4 mt-2' : (isCinemaMode ? 'h-20 mt-3' : 'h-12 mt-3')}
                  `}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    const matchSecs = pct * 3600;
                    const estimatedV = getEstimatedVideoTime(matchSecs);
                    if (videoRef.current && estimatedV !== null) {
                      videoRef.current.currentTime = Math.max(0, Math.min(duration, estimatedV));
                    }
                  }}
                >
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5" />
                  <div 
                    className="absolute top-1/2 left-0 h-[2px] bg-brand shadow-[0_0_15px_rgba(132,204,22,0.8)] transition-all duration-300 z-20" 
                    style={{ width: `${(virtualGameTime / 3600) * 100}%`, transform: 'translateY(-50%)' }}
                  />
                  <div 
                    className="absolute top-0 bottom-0 w-[1px] bg-white/50 z-40 pointer-events-none"
                    style={{ left: `${(virtualGameTime / 3600) * 100}%` }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                  </div>

                  {currentGame?.gameLog?.map((entry, idx) => {
                    const gameSecs = getAbsTime(entry);
                    const pct = (gameSecs / 3600) * 100;
                    if (pct < 0 || pct > 100) return null;
                    const marker = getMarkerInfo(entry);
                    const Icon = marker.icon;
                    return (
                      <div 
                        key={idx}
                        className="absolute transition-all z-20 group/marker"
                        style={{ left: `${pct}%`, top: '50%', transform: 'translateX(-50%)' }}
                        onClick={(e) => { e.stopPropagation(); seekToEntry(entry); }}
                      >
                        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/marker:opacity-100 transition-all duration-300 pointer-events-none z-[999]">
                          <Card className="px-4 py-2 rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center gap-1 min-w-[100px] border-white/20">
                            <span className="text-[7px] font-black text-brand uppercase tracking-widest">{entry.time}</span>
                            <span className="text-[9px] font-black text-zinc-100 uppercase whitespace-nowrap">{entry.action}</span>
                            {entry.playerName && <span className="text-[7px] text-zinc-500 font-bold uppercase truncate max-w-[100px]">{entry.playerName}</span>}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
                          </Card>
                        </div>

                        <div className={`relative flex flex-col items-center ${marker.isGegner ? 'translate-y-1' : '-translate-y-2'}`}>
                          <div 
                            className={`p-0.5 rounded transition-all hover:scale-150 cursor-pointer shadow-lg active:scale-95
                              group-hover/marker:shadow-[0_0_15px_rgba(255,255,255,0.2)]
                            `}
                            style={{ 
                              backgroundColor: `${marker.color}20`, 
                              border: `1px solid ${marker.color}40`, 
                              color: marker.color,
                              boxShadow: `0 0 10px ${marker.color}10`
                            }}
                          >
                            <Icon size={isCinemaMode ? 11 : 9} fill={marker.type === 'goal' ? 'currentColor' : 'none'} strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`flex items-center justify-between ${isFocusMode ? 'gap-2' : 'gap-4'}`}>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 bg-black/40 rounded-2xl border border-white/5 transition-all ${isFocusMode ? 'px-1' : 'px-2 py-1'}`}>
                    <Button variant="ghost" size="sm" icon={SkipBack} onClick={() => videoRef.current.currentTime -= 5} className={isFocusMode ? 'h-7 w-7 p-0' : 'h-10 w-10 p-0'} />
                    <button 
                      onClick={() => isPlaying ? videoRef.current.pause() : videoRef.current.play()}
                      className={`rounded-full bg-brand flex items-center justify-center text-black shadow-xl hover:scale-105 transition-all
                        ${isFocusMode ? 'w-7 h-7' : 'w-12 h-12'}
                      `}
                    >
                      {isPlaying ? <Pause size={isFocusMode ? 14 : 20} fill="currentColor" /> : <Play size={isFocusMode ? 14 : 20} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <Button variant="ghost" size="sm" icon={SkipForward} onClick={() => videoRef.current.currentTime += 5} className={isFocusMode ? 'h-7 w-7 p-0' : 'h-10 w-10 p-0'} />
                  </div>
                  {!isFocusMode && <div className="h-6 w-[1px] bg-white/10 mx-2" />}
                  <div className={`flex items-center gap-3 bg-black/40 rounded-xl border border-white/5 transition-all
                    ${isFocusMode ? 'px-2 py-0.5 scale-75' : 'px-3 py-1.5'}
                  `}>
                    <Volume2 size={12} className="text-zinc-400" />
                    <input 
                      type="range" min="0" max="1" step="0.1" value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className={`${isFocusMode ? 'w-12' : 'w-16'} h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-brand`}
                    />
                  </div>
                  {isCinemaMode && (
                    <button 
                      onClick={() => setIsFocusMode(!isFocusMode)}
                      className={`rounded-xl transition-all ${isFocusMode ? 'p-1.5 bg-brand text-black shadow-lg shadow-brand/20' : 'p-2 bg-white/5 text-zinc-500 hover:text-brand'}`}
                      title={isFocusMode ? "Fokus beenden" : "Fokus Modus (Größeres Video)"}
                    >
                      <Maximize2 size={isFocusMode ? 12 : 14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black text-brand uppercase tracking-widest">Lead Time</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setLeadTime(Math.max(0, leadTime - 1))} className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-black">-</button>
                    <span className="text-sm font-black text-zinc-100 tabular-nums w-3 text-center">{leadTime}</span>
                    <button onClick={() => setLeadTime(leadTime + 1)} className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-black">+</button>
                  </div>
                </div>

                <div className={`flex items-center gap-4 bg-black/40 rounded-2xl border border-white/5 transition-all
                    ${isFocusMode ? 'px-3 py-1 scale-90' : 'px-4 py-2'}
                  `}>
                  {/* H1 Offset */}
                  <div className={`flex flex-col gap-1 ${isFocusMode ? 'min-w-[80px]' : 'min-w-[100px]'}`}>
                    {isEditingH1 ? (
                      <div className="flex items-center gap-1">
                        <input 
                          autoFocus
                          value={manualH1}
                          onChange={(e) => setManualH1(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const s = parseTime(manualH1);
                              setVideoOffsets(prev => ({ ...prev, h1: s }));
                              if (currentGame) {
                                const updated = { ...currentGame, videoOffsets: { ...videoOffsets, h1: s } };
                                updateHistoryGame(updated);
                              }
                              setIsEditingH1(false);
                            }
                            if (e.key === 'Escape') setIsEditingH1(false);
                          }}
                          className="w-16 h-8 bg-black/60 border border-brand/30 rounded text-[10px] font-mono text-center text-brand outline-none"
                          placeholder="00:00"
                        />
                        <button 
                          onClick={() => {
                            const s = parseTime(manualH1);
                            setVideoOffsets(prev => ({ ...prev, h1: s }));
                            if (currentGame) {
                              const updated = { ...currentGame, videoOffsets: { ...videoOffsets, h1: s } };
                              updateHistoryGame(updated);
                            }
                            setIsEditingH1(false);
                          }}
                          className="p-1 text-brand hover:bg-brand/10 rounded"
                        >
                          <CheckCircle size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant={videoOffsets.h1 !== null ? "primary" : "ghost"} 
                            size="sm"
                            icon={Clock}
                            onClick={() => setHalfOffset(1)}
                            className={`text-[9px] flex-1 ${isFocusMode ? 'h-7' : 'h-8'}`}
                          >
                            {videoOffsets.h1 !== null ? `H1: ${formatiereZeit(videoOffsets.h1)}` : 'Set H1'}
                          </Button>
                          <button 
                            onClick={() => {
                              setManualH1(videoOffsets.h1 !== null ? formatiereZeit(videoOffsets.h1) : '');
                              setIsEditingH1(true);
                            }}
                            className="p-1 text-zinc-500 hover:text-brand transition-all"
                          >
                            <Settings2 size={12} />
                          </button>
                        </div>
                        {videoOffsets.h1 !== null && !isFocusMode && (
                          <button onClick={() => jumpToOffset(1)} className="text-[8px] font-black text-brand uppercase text-center hover:underline">Jump H1</button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="h-8 w-px bg-white/5 mx-1" />

                  {/* H2 Offset */}
                  <div className={`flex flex-col gap-1 ${isFocusMode ? 'min-w-[80px]' : 'min-w-[100px]'}`}>
                    {isEditingH2 ? (
                      <div className="flex items-center gap-1">
                        <input 
                          autoFocus
                          value={manualH2}
                          onChange={(e) => setManualH2(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const s = parseTime(manualH2);
                              setVideoOffsets(prev => ({ ...prev, h2: s }));
                              if (currentGame) {
                                const updated = { ...currentGame, videoOffsets: { ...videoOffsets, h2: s } };
                                updateHistoryGame(updated);
                              }
                              setIsEditingH2(false);
                            }
                            if (e.key === 'Escape') setIsEditingH2(false);
                          }}
                          className="w-16 h-8 bg-black/60 border border-brand/30 rounded text-[10px] font-mono text-center text-brand outline-none"
                          placeholder="00:00"
                        />
                        <button 
                          onClick={() => {
                            const s = parseTime(manualH2);
                            setVideoOffsets(prev => ({ ...prev, h2: s }));
                            if (currentGame) {
                              const updated = { ...currentGame, videoOffsets: { ...videoOffsets, h2: s } };
                              updateHistoryGame(updated);
                            }
                            setIsEditingH2(false);
                          }}
                          className="p-1 text-brand hover:bg-brand/10 rounded"
                        >
                          <CheckCircle size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant={videoOffsets.h2 !== null ? "primary" : "ghost"} 
                            size="sm"
                            icon={Clock}
                            onClick={() => setHalfOffset(2)}
                            className={`text-[9px] flex-1 ${isFocusMode ? 'h-7' : 'h-8'}`}
                          >
                            {videoOffsets.h2 !== null ? `H2: ${formatiereZeit(videoOffsets.h2)}` : 'Set H2'}
                          </Button>
                          <button 
                            onClick={() => {
                              setManualH2(videoOffsets.h2 !== null ? formatiereZeit(videoOffsets.h2) : '');
                              setIsEditingH2(true);
                            }}
                            className="p-1 text-zinc-500 hover:text-brand transition-all"
                          >
                            <Settings2 size={12} />
                          </button>
                        </div>
                        {videoOffsets.h2 !== null && !isFocusMode && (
                          <button onClick={() => jumpToOffset(2)} className="text-[8px] font-black text-brand uppercase text-center hover:underline">Jump H2</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className={`flex flex-col min-h-0 transition-all duration-700 ease-in-out overflow-hidden
            ${isCinemaMode 
              ? (isFocusMode ? 'w-[12%]' : 'w-[28%]') 
              : 'w-[35%] flex-shrink-0'}
          `}>
            <Card noPadding className="backdrop-blur-xl border border-white/5 rounded-[32px] flex flex-col h-full shadow-2xl overflow-hidden min-h-0">
              <div className="p-5 border-b border-white/5 bg-black/20 flex flex-col gap-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <List size={16} className="text-brand" />
                  {!isFocusMode && <span className="text-[10px] font-black uppercase tracking-widest text-zinc-100">Tactical Engine</span>}
                  <Button 
                    variant={syncFollow ? "primary" : "ghost"} 
                    size="sm"
                    onClick={() => setSyncFollow(!syncFollow)}
                    className={`text-[8px] h-auto py-1 px-2 ${isFocusMode ? 'scale-75' : ''}`}
                  >
                    {isFocusMode ? 'F' : 'Follow'}
                  </Button>
                </div>
                <div className={`flex flex-col gap-2 ${isFocusMode ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
                  <Input 
                    placeholder="Quick Filter..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={Search}
                    noPadding
                    className="border-white/5 bg-black/40 text-xs py-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select 
                      value={filterAction}
                      onChange={(e) => setFilterAction(e.target.value)}
                      className="text-[10px] py-2 bg-black/40 border-white/5"
                      options={[
                        { value: 'all', label: 'Alle Aktionen' },
                        { value: 'important', label: '⭐ Nur Highlights' },
                        { value: 'all_goals', label: 'Alle Tore' },
                        { value: 'home_goals', label: 'Heimtore' },
                        { value: 'away_goals', label: 'Gegnertore' },
                        ...uniqueActions.map(a => ({ value: a, label: a }))
                      ]}
                    />
                    <Select 
                      value={filterPlayer}
                      onChange={(e) => setFilterPlayer(e.target.value)}
                      className="text-[10px] py-2 bg-black/40 border-white/5"
                      options={[
                        { value: 'all', label: 'Alle Spieler' },
                        ...Array.from(new Map((currentGame?.gameLog || []).map(e => [String(e.playerId || e.playerNumber || e.gegnerNummer || ''), e.playerName || `Spieler #${e.playerId || e.playerNumber || e.gegnerNummer}`])).entries())
                          .filter(([id]) => id !== '')
                          .map(([id, name]) => ({ value: id, label: name }))
                      ]}
                    />
                  </div>
                  
                  <Button 
                    variant={isAutoplayActive ? "destructive" : "primary"}
                    size="sm"
                    className="w-full mt-1 gap-2 h-9 shadow-lg"
                    onClick={() => isAutoplayActive ? setIsAutoplayActive(false) : startAutoplay()}
                    icon={isAutoplayActive ? Pause : Play}
                  >
                    {isAutoplayActive ? 'Clips stoppen' : 'Clips starten'}
                  </Button>

                  <Button 
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 gap-2 h-9 border border-white/5 bg-white/5 hover:bg-brand/10 hover:text-brand transition-all"
                    onClick={() => {
                      setIsAddingHighlight(!isAddingHighlight);
                      if (!isAddingHighlight) {
                        // Default name or action
                        setNewHighlightName('Taktisches Highlight');
                      }
                    }}
                    icon={Zap}
                  >
                    {isAddingHighlight ? 'Abbrechen' : 'Highlight einfügen'}
                  </Button>

                  {isAddingHighlight && (
                    <div className="mt-3 p-4 bg-brand/5 border border-brand/20 rounded-2xl flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] uppercase font-black text-brand tracking-widest">Name der Aktion</label>
                        <input 
                          value={newHighlightName}
                          onChange={(e) => setNewHighlightName(e.target.value)}
                          className="w-full h-8 bg-black/60 border border-white/10 rounded-lg text-[10px] px-3 text-white focus:border-brand outline-none"
                          placeholder="z.B. Starkes 1vs1"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] uppercase font-black text-zinc-500 tracking-widest">Spieler (Optional)</label>
                        <Select 
                          value={newHighlightPlayer}
                          onChange={(e) => setNewHighlightPlayer(e.target.value)}
                          className="text-[10px] py-1.5 h-auto bg-black/40 border-white/5"
                          options={[
                            { value: '', label: 'Kein Spieler' },
                            ...Array.from(new Map((currentGame?.gameLog || []).map(e => [String(e.playerId || e.playerNumber || e.gegnerNummer || ''), e.playerName || `Spieler #${e.playerId || e.playerNumber || e.gegnerNummer}`])).entries())
                              .filter(([id]) => id !== '')
                              .map(([id, name]) => ({ value: id, label: name }))
                          ]}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase font-black text-zinc-500 tracking-widest">Video Zeit</label>
                          <span className="text-[10px] font-mono text-zinc-300 bg-black/40 px-2 py-1 rounded border border-white/5">
                            {formatiereZeit(videoRef.current?.currentTime || 0)}
                          </span>
                        </div>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="h-9 px-4 gap-2"
                          onClick={() => {
                            const vTime = videoRef.current?.currentTime || 0;
                            const estimatedMatchTime = virtualGameTime; // Current virtual clock time
                            
                            const newEntry = {
                              id: `hl_${Date.now()}`,
                              action: newHighlightName,
                              time: formatiereZeit(estimatedMatchTime),
                              officialTime: formatiereZeit(estimatedMatchTime),
                              videoTime: vTime,
                              isImportant: true,
                              timestamp: Date.now(), // approximation
                              playerName: newHighlightPlayer ? (currentGame?.gameLog || []).find(e => String(e.playerId || e.playerNumber || e.gegnerNummer || '') === newHighlightPlayer)?.playerName : ''
                            };
                            
                            const updatedLog = [...(currentGame?.gameLog || []), newEntry];
                            const updatedGame = { ...currentGame, gameLog: updatedLog };
                            setCurrentGame(updatedGame);
                            updateHistoryGame(updatedGame);
                            setIsAddingHighlight(false);
                            setNotification('Highlight hinzugefügt!');
                          }}
                        >
                          <CheckCircle size={14} />
                          <span className="text-[10px] font-bold uppercase text-black">Speichern</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div ref={protocolListRef} className="flex-1 overflow-y-auto custom-scrollbar bg-black/10 min-h-0">
                {sortedLog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-700 opacity-30 p-8 text-center">
                    <List size={32} className="mb-2" />
                    <p className="text-[9px] font-black uppercase tracking-widest">No Events</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {sortedLog.map((entry, idx) => {
                      const estimatedVideoTime = getEstimatedVideoTime(entry);
                      const isActive = activeEntryIndex === idx;
                      const isEditing = editingIndex === idx;

                      if (isEditing) {
                        return (
                          <div 
                            key={idx}
                            className="flex flex-col p-4 bg-brand/10 border-y border-brand/30 relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Glow effect background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[40px] -z-10 rounded-full" />
                            
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[8px] uppercase font-black text-brand tracking-widest">Match Time</label>
                                  <input 
                                    value={editGameTime}
                                    onChange={(e) => setEditGameTime(e.target.value)}
                                    className="w-20 h-9 bg-black/80 border-2 border-brand/20 rounded-lg text-xs font-bold text-center text-white focus:border-brand transition-all outline-none"
                                    placeholder="00:00"
                                  />
                                </div>
                                <div className="h-8 w-px bg-white/10 mt-4" />
                                <div className="flex flex-col gap-1 flex-1">
                                  <label className="text-[8px] uppercase font-black text-zinc-500 tracking-widest">Aktion</label>
                                  <span className="text-xs font-black text-white uppercase truncate">{entry.action}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="primary" 
                                  size="sm" 
                                  className="h-9 px-3 gap-2 shadow-lg shadow-brand/20" 
                                  onClick={handleSaveEdit}
                                >
                                  <CheckCircle size={14} />
                                  <span className="text-[10px] font-bold uppercase">Save</span>
                                </Button>
                                <button 
                                  onClick={() => {
                                    const newLog = currentGame.gameLog.map((e, i) => 
                                      i === idx ? { ...e, isImportant: !e.isImportant } : e
                                    );
                                    const updatedGame = { ...currentGame, gameLog: newLog };
                                    setCurrentGame(updatedGame);
                                    updateHistoryGame(updatedGame);
                                  }}
                                  className={`p-2 transition-all rounded-lg ${entry.isImportant ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'bg-black/60 text-zinc-500 hover:text-brand'}`}
                                  title="Wichtige Aktion markieren"
                                >
                                  <Star size={14} fill={entry.isImportant ? "currentColor" : "none"} />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] uppercase font-black text-zinc-500 tracking-widest">Spieler / Gegner</label>
                                <span className="text-[10px] font-bold text-zinc-300 truncate max-w-[120px]">
                                  {entry.playerName || `Opp #${entry.gegnerNummer || '?'}`}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1 items-end">
                                  <label className="text-[8px] uppercase font-black text-zinc-500 tracking-widest">Video Position</label>
                                  <div className="flex items-center bg-black/60 rounded-lg border border-white/10 overflow-hidden h-8">
                                    <input 
                                      value={editVideoTime}
                                      onChange={(e) => setEditVideoTime(e.target.value)}
                                      className="w-16 h-full bg-transparent border-none text-[10px] font-mono text-center focus:outline-none text-white"
                                    />
                                    <button 
                                      onClick={() => setEditVideoTime(formatiereZeit(videoRef.current.currentTime))}
                                      title="Zeit vom Video übernehmen"
                                      className="h-full px-2 bg-brand/10 hover:bg-brand hover:text-black transition-all border-l border-white/10"
                                    >
                                      <Clock size={12} />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="h-8 w-px bg-white/10" />
                                
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => {
                                      if (confirm('Eintrag wirklich löschen?')) {
                                        const newLog = currentGame.gameLog.filter((_, i) => i !== idx);
                                        const updatedGame = { ...currentGame, gameLog: newLog };
                                        setCurrentGame(updatedGame);
                                        updateHistoryGame(updatedGame);
                                        setEditingIndex(-1);
                                      }
                                    }}
                                    className="p-2 hover:bg-red-500/10 text-red-500 transition-all rounded-lg"
                                    title="Eintrag löschen"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingIndex(-1)}
                                    className="p-2 hover:bg-white/5 text-zinc-500 transition-all rounded-lg"
                                    title="Abbrechen"
                                  >
                                    <ArrowLeft size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={idx}
                          className={`flex flex-col p-4 border-b border-white/[0.03] cursor-pointer transition-all relative
                            ${isActive ? 'bg-brand text-black shadow-lg' : 'hover:bg-white/[0.02] text-zinc-400'}
                            ${entry.isImportant && !isActive && !isFocusMode ? 'border-l-4 border-brand bg-brand/5' : ''}
                            ${isFocusMode ? 'px-2 py-2' : ''}
                          `}
                          onClick={() => seekToEntry(entry)}
                        >
                          {entry.isImportant && !isActive && !isFocusMode && (
                            <div className={`absolute top-2 right-12 flex items-center gap-1 ${isActive ? 'text-black' : 'text-brand'}`}>
                              <Star size={8} fill="currentColor" />
                              <span className="text-[6px] font-black uppercase">Highlight</span>
                            </div>
                          )}
                          <div className={`flex items-center justify-between ${isFocusMode ? 'mb-0.5' : 'mb-1.5'}`}>
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className={`font-mono text-[9px] font-bold px-1 py-0.5 rounded border flex-shrink-0 ${isActive ? 'border-black/20' : 'text-zinc-600 border-white/5'}`}>{entry.time}</span>
                              <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isActive ? 'text-black' : 'text-zinc-200'}`}>{entry.action}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!isFocusMode && <span className={`text-[10px] font-black ${isActive ? 'text-black' : 'text-brand'}`}>{entry.score}</span>}
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEntry(idx, entry);
                                }}
                                className={`p-1 rounded-lg transition-all ${isActive ? 'hover:bg-black/10 text-black' : 'hover:bg-brand/10 text-zinc-600 hover:text-brand'} ${isFocusMode ? 'scale-75' : ''}`}
                              >
                                <Settings2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div className={`flex items-center justify-between opacity-80 ${isFocusMode ? 'text-[8px]' : ''}`}>
                            <span className={`font-black uppercase tracking-widest truncate ${isFocusMode ? 'max-w-[40px] text-[8px]' : 'max-w-[140px] text-[9px]'} ${isActive ? 'text-black/80' : 'text-zinc-500'}`}>
                              {entry.playerName || `Opp #${entry.gegnerNummer || '?'}`}
                            </span>
                            <span className={`font-mono tabular-nums ${isFocusMode ? 'text-[8px]' : 'text-[9px]'} ${isActive ? 'text-black/60' : 'text-zinc-700'}`}>{formatiereZeit(estimatedVideoTime)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      <Modal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Data Sync Hub">
        <div className="flex flex-col gap-6 p-4">
          <Input 
            placeholder="Enter match URL..." 
            value={syncUrl}
            onChange={(e) => setSyncUrl(e.target.value)}
          />
          <Button 
            variant="primary" 
            className="w-full py-4"
            onClick={handleSync}
          >
            Daten synchronisieren
          </Button>
        </div>
      </Modal>

      {notification && (
        <div className="fixed bottom-12 right-12 z-[10000] animate-in fade-in slide-in-from-right-8 duration-500">
          <Card className="backdrop-blur-2xl border border-white/10 rounded-[28px] p-5 shadow-2xl flex items-center gap-5 min-w-[340px]">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
              <Info size={28} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-zinc-100">{notification.title}</p>
              <p className="text-[11px] text-zinc-500 font-bold mt-1 leading-tight">{notification.message}</p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default VideoAnalysisTab;
