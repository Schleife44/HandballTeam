import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2,
  Search, Filter, Clock, Save, Trash2, ArrowLeft,
  CheckCircle, Video, List, Zap, Settings, Settings2, ChevronRight, Globe,
  Circle, Triangle, Square, Info, AlertTriangle, Volume2
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

const CLIP_DURATION = 6;
const DEFAULT_LEAD_TIME = 3;

const VideoAnalysisTab = ({ initialGame, onBack }) => {
  const { squad, updateHistoryGame } = useStore();
  const [currentGame, setCurrentGame] = useState(initialGame);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoOffsets, setVideoOffsets] = useState({ h1: 0, h2: 0 });
  const [leadTime, setLeadTime] = useState(DEFAULT_LEAD_TIME);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [autoplayIndex, setAutoplayIndex] = useState(-1);
  const [clipEndTime, setClipEndTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [hideAdministrative, setHideAdministrative] = useState(true);
  const [syncFollow, setSyncFollow] = useState(true);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

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
      setVideoOffsets(initialGame.videoOffsets || { h1: 0, h2: 0 });
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
      title: `Anwurf H${half} gesetzt`,
      message: `Video-Position: ${formatiereZeit(time)}`,
      type: 'success'
    });
  };

  const getAbsTime = (entry) => {
    if (!entry) return 0;
    const base = getSecs(entry.officialTime || entry.time || "00:00");
    const shift = entry.manualShift || 0;
    const total = base + shift;
    
    if ((entry.half === 2 || entry.period === 2) && total < 1800) {
      return total + 1800;
    }
    return total;
  };

  const getEstimatedVideoTime = (entry) => {
    if (!entry) return null;
    if (entry.videoTime !== undefined && entry.videoTime !== null) return entry.videoTime;

    const gameSecs = getAbsTime(entry);
    const h = gameSecs > 1800 ? 2 : 1;

    let anchor = null;
    const logToUse = currentGame.gameLog || currentGame.log || [];
    if (logToUse.length > 0) {
      logToUse.forEach(logE => {
        if (logE.videoTime === undefined || logE.videoTime === null) return;
        const candAbs = getAbsTime(logE);
        const candH = candAbs > 1800 ? 2 : 1;
        if (candH !== h) return;

        if (candAbs <= gameSecs) {
          if (!anchor || candAbs > getAbsTime(anchor)) {
            anchor = logE;
          }
        }
      });
    }

    if (anchor) {
      if (entry.timestamp && anchor.timestamp) {
        const msDelta = entry.timestamp - anchor.timestamp;
        return anchor.videoTime + (msDelta / 1000);
      }

      const anchorAbs = getAbsTime(anchor);
      const deltaProtocol = gameSecs - anchorAbs;
      return anchor.videoTime + deltaProtocol;
    }

    const offset = h === 1 ? videoOffsets.h1 : videoOffsets.h2;
    const relSecs = h === 1 ? gameSecs : gameSecs - 1800;
    
    if (offset === 0 && h === 2 && videoOffsets.h1 !== 0) {
      return videoOffsets.h1 + 1800 + relSecs;
    }
    return offset + relSecs;
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

  const handleSaveEdit = async (idx, entry) => {
    const logToUse = currentGame.gameLog || currentGame.log || [];
    if (logToUse.length === 0) return;
    
    const newLog = [...logToUse];
    const originalIdx = newLog.findIndex(e => e.timestamp === entry.timestamp);
    
    if (originalIdx !== -1) {
      const updatedEntry = { ...newLog[originalIdx] };
      updatedEntry.time = editGameTime;
      updatedEntry.manualShift = 0;
      updatedEntry.half = (getSecs(editGameTime) > 1800) ? 2 : 1;
      
      const newVTime = parseTime(editVideoTime);
      const estV = getEstimatedVideoTime(entry);
      if (newVTime !== estV) {
        updatedEntry.videoTime = newVTime;
      }

      newLog[originalIdx] = updatedEntry;
      const updatedGame = { ...currentGame, gameLog: newLog };
      
      setCurrentGame(updatedGame);
      updateHistoryGame(updatedGame);
    }
    setEditingIndex(-1);
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

      const matchAction = filterAction === 'all' || entry.action === filterAction;
      
      if (hideAdministrative) {
        const actionText = (entry.action || '').toLowerCase();
        const adminTerms = ['halbzeit', 'spielende', 'start', 'period', 'pause', 'beginn', 'stopp', 'vorbeiting'];
        if (adminTerms.some(term => actionText.includes(term))) return false;
        
        const isGenericPlayer = !entry.playerName || entry.playerName.includes('Spieler #') || entry.playerName.includes('Gegner #');
        if ((entry.time === '00:00' || entry.time === '30:00') && isGenericPlayer && !actionText.includes('tor') && !actionText.includes('minuten') && !actionText.includes('verwarnung')) {
          return false;
        }
      }
      
      return matchSearch && matchAction;
    });
  }, [currentGame, searchTerm, filterAction, hideAdministrative]);

  const sortedLog = useMemo(() => {
    return [...filteredLog].sort((a, b) => {
      const getAbs = (e) => {
        const base = parseTime(e.officialTime || e.time);
        const act = base + (e.manualShift || 0);
        const h = e.half || (act > 1800 ? 2 : 1);
        return (h - 1) * 1800 + act;
      };
      return getAbs(a) - getAbs(b);
    });
  }, [filteredLog]);

  const uniqueActions = useMemo(() => {
    if (!currentGame || !currentGame.gameLog) return [];
    return Array.from(new Set(currentGame.gameLog.map(e => e.action))).sort();
  }, [currentGame]);

  // Sync Protocol with Video & Virtual Game Time
  useEffect(() => {
    if (!videoRef.current || !currentGame || sortedLog.length === 0) return;

    let foundIndex = -1;
    for (let i = sortedLog.length - 1; i >= 0; i--) {
      const estV = getEstimatedVideoTime(sortedLog[i]);
      if (estV !== null && currentTime >= estV - leadTime - 0.1) {
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
      const baseSecs = getSecs(activeEntry.officialTime || activeEntry.time || "00:00");
      const gameSecs = baseSecs + (activeEntry.manualShift || 0);
      const estV = getEstimatedVideoTime(activeEntry);
      vTime = gameSecs + (currentTime - estV);
    } else {
      if (currentTime < videoOffsets.h1) vTime = 0;
      else if (currentTime < videoOffsets.h1 + 1800) vTime = currentTime - videoOffsets.h1;
      else if (videoOffsets.h2 > 0 && currentTime >= videoOffsets.h2) vTime = 1800 + Math.min(1800, currentTime - videoOffsets.h2);
      else vTime = 1800;
    }
    setVirtualGameTime(Math.max(0, Math.min(3600, vTime)));

  }, [currentTime, currentGame, sortedLog, syncFollow, videoOffsets]);

  useEffect(() => {
    if (isAutoplayActive && isPlaying && currentTime >= clipEndTime) {
      const nextIndex = autoplayIndex + 1;
      if (nextIndex < sortedLog.length) {
        const nextEntry = sortedLog[nextIndex];
        setAutoplayIndex(nextIndex);
        const target = getEstimatedVideoTime(nextEntry) - leadTime;
        videoRef.current.currentTime = Math.max(0, target);
        setClipEndTime(target + leadTime + CLIP_DURATION);
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
          <div className={`flex flex-col gap-4 min-h-0 transition-all duration-700 
            ${isCinemaMode ? 'w-[72%]' : 'w-[65%] flex-grow'}
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

            <Card noPadding className="backdrop-blur-xl border border-white/5 rounded-[32px] flex flex-col gap-4 shadow-2xl flex-shrink-0 transition-all duration-700 p-4">
              <div className="relative">
                <div className="absolute -top-1 left-2 right-2 flex justify-between items-center z-50 pointer-events-none">
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
                  className={`relative bg-zinc-950/80 rounded-2xl border border-white/5 cursor-crosshair group mt-3 transition-all ${isCinemaMode ? 'h-20' : 'h-12'}`}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    const targetVTime = pct * 3600;
                    let bestVideoTime = 0;
                    if (targetVTime < 1800) {
                      bestVideoTime = videoOffsets.h1 + targetVTime;
                    } else {
                      bestVideoTime = videoOffsets.h2 + (targetVTime - 1800);
                    }
                    if (videoRef.current) videoRef.current.currentTime = bestVideoTime;
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

                        <div className={`relative flex flex-col items-center ${marker.isGegner ? 'mt-1' : '-translate-y-full mb-1'}`}>
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

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" icon={SkipBack} onClick={() => videoRef.current.currentTime -= 5} className="h-10 w-10 p-0" />
                    <button 
                      onClick={() => isPlaying ? videoRef.current.pause() : videoRef.current.play()}
                      className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-black shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <Button variant="ghost" size="sm" icon={SkipForward} onClick={() => videoRef.current.currentTime += 5} className="h-10 w-10 p-0" />
                  </div>
                  <div className="h-6 w-[1px] bg-white/10 mx-2" />
                  <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                    <Volume2 size={12} className="text-zinc-400" />
                    <input 
                      type="range" min="0" max="1" step="0.1" value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-16 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-brand"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black text-brand uppercase tracking-widest">Lead Time</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setLeadTime(Math.max(0, leadTime - 1))} className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-black">-</button>
                    <span className="text-sm font-black text-zinc-100 tabular-nums w-3 text-center">{leadTime}</span>
                    <button onClick={() => setLeadTime(leadTime + 1)} className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-black">+</button>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
                  <Button 
                    variant={videoOffsets.h1 !== 0 ? "primary" : "ghost"} 
                    size="sm"
                    icon={Clock}
                    onClick={() => setHalfOffset(1)}
                    className="text-[9px]"
                  >
                    {videoOffsets.h1 !== 0 ? `${videoOffsets.h1.toFixed(0)}s` : 'Set H1'}
                  </Button>
                  <Button 
                    variant={videoOffsets.h2 !== 0 ? "primary" : "ghost"} 
                    size="sm"
                    icon={Clock}
                    onClick={() => setHalfOffset(2)}
                    className="text-[9px]"
                  >
                    {videoOffsets.h2 !== 0 ? `${videoOffsets.h2.toFixed(0)}s` : 'Set H2'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className={`flex flex-col min-h-0 transition-all duration-700
            ${isCinemaMode ? 'w-[28%]' : 'w-[35%] flex-shrink-0'}
          `}>
            <Card noPadding className="backdrop-blur-xl border border-white/5 rounded-[32px] flex flex-col h-full shadow-2xl overflow-hidden min-h-0">
              <div className="p-5 border-b border-white/5 bg-black/20 flex flex-col gap-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <List size={16} className="text-brand" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-100">Tactical Engine</span>
                  </div>
                  <Button 
                    variant={syncFollow ? "primary" : "ghost"} 
                    size="sm"
                    onClick={() => setSyncFollow(!syncFollow)}
                    className="text-[8px] h-auto py-1 px-2"
                  >
                    Follow
                  </Button>
                </div>
                <div className="relative">
                  <Input 
                    placeholder="Quick Filter..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={Search}
                    noPadding
                    className="border-white/5 bg-black/40 text-xs py-2"
                  />
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
                      return (
                        <div 
                          key={idx}
                          className={`flex flex-col p-4 border-b border-white/[0.03] cursor-pointer transition-all relative
                            ${isActive ? 'bg-brand text-black shadow-lg' : 'hover:bg-white/[0.02] text-zinc-400'}
                          `}
                          onClick={() => seekToEntry(entry)}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${isActive ? 'border-black/20' : 'text-zinc-600 border-white/5'}`}>{entry.time}</span>
                              <span className={`text-[11px] font-black uppercase tracking-tight ${isActive ? 'text-black' : 'text-zinc-200'}`}>{entry.action}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black ${isActive ? 'text-black' : 'text-brand'}`}>{entry.score}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className={`p-1.5 rounded-lg transition-all ${isActive ? 'hover:bg-black/10 text-black' : 'hover:bg-brand/10 text-zinc-600 hover:text-brand'}`}
                              >
                                <Settings2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between opacity-80">
                            <span className={`text-[9px] font-black uppercase tracking-widest truncate max-w-[140px] ${isActive ? 'text-black/80' : 'text-zinc-500'}`}>
                              {entry.playerName || `Opp #${entry.gegnerNummer || '?'}`}
                            </span>
                            <span className={`font-mono text-[9px] tabular-nums ${isActive ? 'text-black/60' : 'text-zinc-700'}`}>{formatiereZeit(estimatedVideoTime)}</span>
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
            Initialize Synchronisation
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
