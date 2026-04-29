import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Maximize2, Minimize2, Play, Pause, SkipBack, SkipForward, 
  Volume2, Settings2, Clock, List, Search, CheckCircle, Trash2, Star, Info, Plus
} from 'lucide-react';

// Store
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';

// Utils
import { formatiereZeit, parseTime } from '../../utils/timeUtils';
import { fuzzyMatch } from '../../utils/searchUtils';

// Modular Parts
import VideoEngine from './videoAnalysis/parts/VideoEngine';
import TacticalTimeline from './videoAnalysis/parts/TacticalTimeline';
import EventList from './videoAnalysis/parts/EventList';
import { useVideoSync } from './videoAnalysis/hooks/useVideoSync';

const DEFAULT_LEAD_TIME = 4;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
};

const VideoAnalysisTab = ({ initialGame, onBack }) => {
  const { squad, updateHistoryGame } = useStore();
  
  // -- State --
  const [currentGame, setCurrentGame] = useState(initialGame);
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [leadTime, setLeadTime] = useState(DEFAULT_LEAD_TIME);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterPlayer, setFilterPlayer] = useState('all');
  const [hideAdministrative, setHideAdministrative] = useState(true);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [videoOffsets, setVideoOffsets] = useState({
    h1: initialGame?.videoOffsets?.h1 ?? null,
    h2: initialGame?.videoOffsets?.h2 ?? null
  });
  const [notification, setNotification] = useState(null);
  const [isPlaylistMode, setIsPlaylistMode] = useState(false);
  const [playlistIndex, setPlaylistIndex] = useState(-1);
  const [clipDuration, setClipDuration] = useState(8); 

  // -- Edit & Add State --
  const [isEditingH1, setIsEditingH1] = useState(false);
  const [isEditingH2, setIsEditingH2] = useState(false);
  const [manualH1, setManualH1] = useState('');
  const [manualH2, setManualH2] = useState('');

  const [editingIndex, setEditingIndex] = useState(-1);
  const [editGameTime, setEditGameTime] = useState('');
  const [editVideoTime, setEditVideoTime] = useState('');

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventData, setNewEventData] = useState({
    time: '', playerName: '', playerId: '', action: 'Tactical Note'
  });

  // -- Refs --
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const protocolListRef = useRef(null);

  // -- Data Derivation --
  const playerOptions = useMemo(() => {
    const log = currentGame?.gameLog || currentGame?.log || [];
    const players = new Map();
    
    log.forEach(e => {
      const pName = (e.playerName || '').trim();
      const pId = String(e.playerId || e.playerNumber || e.gegnerNummer || '');
      
      if (!pName && !pId) return;
      
      const displayName = pName || `Spieler #${pId}`;
      // Create a truly unique ID combining name and ID to prevent conflicts between home/away players with same number
      const compositeId = `${pName}_${pId}`;

      if (!players.has(compositeId) || (players.get(compositeId).name.startsWith('Spieler #') && pName)) {
        players.set(compositeId, { id: compositeId, name: displayName });
      }
    });

    return Array.from(players.values())
      .filter(p => p.name !== 'Spieler #' && p.name !== 'GEGNER #' && p.name !== 'Spieler #?')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [currentGame]);

  const uniqueActions = useMemo(() => {
    const log = currentGame?.gameLog || currentGame?.log || [];
    return Array.from(new Set(log.map(e => e.action).filter(Boolean)));
  }, [currentGame]);

  const filteredLog = useMemo(() => {
    if (!currentGame) return [];
    const log = currentGame.gameLog || currentGame.log || [];
    
    // Create a quick lookup for player names in case an entry is missing the name field
    const playerNameMap = new Map();
    playerOptions.forEach(p => playerNameMap.set(String(p.id), p.name));

    return log.filter(entry => {
      if (hideAdministrative) {
        const actionText = (entry.action || '').toLowerCase();
        if (['halbzeit', 'spielende', 'start', 'period', 'timeout'].some(t => actionText.includes(t))) return false;
      }
      if (filterAction !== 'all') {
        const actionLower = (entry.action || '').toLowerCase();
        if (filterAction === 'all_goals') {
          if (!actionLower.includes('tor')) return false;
        } else if (filterAction === 'home_goals') {
          if (!actionLower.includes('tor') || actionLower.includes('gegner')) return false;
        } else if (filterAction === 'away_goals') {
          if (!actionLower.includes('tor') || !actionLower.includes('gegner')) return false;
        } else if (filterAction === 'important') {
          if (!entry.isImportant) return false;
        } else {
          if (entry.action !== filterAction) return false;
        }
      }
      if (filterPlayer !== 'all') {
        const id = entry.playerId || entry.playerNumber || entry.gegnerNummer;
        const name = entry.playerName || '';
        const compositeId = `${name}_${id}`;
        if (compositeId !== filterPlayer) return false;
      }
      
      if (searchTerm) {
        const id = entry.playerId || entry.playerNumber || entry.gegnerNummer;
        const nameFromMap = id ? playerNameMap.get(String(id)) : '';
        const nameOnEntry = entry.playerName || '';
        
        const matchesAction = fuzzyMatch(entry.action || '', searchTerm);
        const matchesName = fuzzyMatch(nameOnEntry, searchTerm) || (nameFromMap && fuzzyMatch(nameFromMap, searchTerm));
        
        if (!matchesAction && !matchesName) return false;
      }
      
      return true;
    });
  }, [currentGame, hideAdministrative, filterAction, filterPlayer, searchTerm, playerOptions]);

  const sortedLog = useMemo(() => {
    return [...filteredLog].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }, [filteredLog]);

  const { getAbsTime, getEstimatedVideoTime, calculateVirtualGameTime } = useVideoSync(videoOffsets, sortedLog);

  const { virtualGameTime, activeEntryIndex } = useMemo(() => 
    calculateVirtualGameTime(currentTime), 
    [calculateVirtualGameTime, currentTime]
  );

  // -- Effects --
  useEffect(() => {
    // Lock background scroll when analysis is open (target main layout container)
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.style.overflow = 'hidden';
    }
    return () => {
      if (mainEl) mainEl.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!isCinemaMode && isFocusMode) {
      setIsFocusMode(false);
    }
  }, [isCinemaMode, isFocusMode]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!isPlaylistMode || playlistIndex === -1 || !sortedLog[playlistIndex]) return;
    const entry = sortedLog[playlistIndex];
    const nextEntry = sortedLog[playlistIndex + 1];
    if (nextEntry) {
      const nextStartTime = getEstimatedVideoTime(nextEntry) - leadTime;
      if (currentTime >= nextStartTime) {
        setPlaylistIndex(prev => prev + 1);
        return;
      }
    }
    const endTime = getEstimatedVideoTime(entry) + (clipDuration - leadTime);
    if (currentTime >= endTime) {
      if (playlistIndex < sortedLog.length - 1) setPlaylistIndex(prev => prev + 1);
      else {
        setIsPlaylistMode(false);
        setPlaylistIndex(-1);
        setNotification({ title: 'Playlist Finished', message: 'All filtered clips played.' });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  }, [currentTime, isPlaylistMode, playlistIndex, sortedLog, leadTime, clipDuration, getEstimatedVideoTime]);

  useEffect(() => {
    if (isPlaylistMode && playlistIndex !== -1 && sortedLog[playlistIndex]) {
      const entry = sortedLog[playlistIndex];
      const target = getEstimatedVideoTime(entry) - leadTime;
      if (videoRef.current) {
        const diff = Math.abs(videoRef.current.currentTime - target);
        if (diff > 2 && target > videoRef.current.currentTime) {
          videoRef.current.currentTime = Math.max(0, target);
        } else if (target < videoRef.current.currentTime - 1) {
          // Skip
        } else {
          videoRef.current.currentTime = Math.max(0, target);
        }
        videoRef.current.play();
      }
    }
  }, [playlistIndex, isPlaylistMode]);

  // -- Handlers --
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setVideoUrl(URL.createObjectURL(file));
  };

  const setHalfOffset = (half) => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    const newOffsets = { ...videoOffsets, [half === 1 ? 'h1' : 'h2']: time };
    setVideoOffsets(newOffsets);
    updateHistoryGame({ ...currentGame, videoOffsets: newOffsets });
    setNotification({ title: 'Sync Point Set', message: `${half === 1 ? 'H1' : 'H2'} start locked at ${formatiereZeit(time)}` });
    setTimeout(() => setNotification(null), 3000);
  };

  const seekToEntry = (entry) => {
    if (!videoRef.current) return;
    setIsPlaylistMode(false);
    const target = getEstimatedVideoTime(entry) - leadTime;
    videoRef.current.currentTime = Math.max(0, target);
    videoRef.current.play();
  };

  const togglePlaylist = () => {
    if (isPlaylistMode) {
      setIsPlaylistMode(false);
      setPlaylistIndex(-1);
    } else {
      if (sortedLog.length === 0) return;
      setIsPlaylistMode(true);
      setPlaylistIndex(0);
    }
  };

  const onManualSave = (half, timeStr) => {
    if (!timeStr) {
      half === 1 ? setIsEditingH1(false) : setIsEditingH2(false);
      return;
    }
    const s = parseTime(timeStr.trim());
    const newOffsets = { ...videoOffsets, [half === 1 ? 'h1' : 'h2']: s };
    setVideoOffsets(newOffsets);
    updateHistoryGame({ ...currentGame, videoOffsets: newOffsets });
    half === 1 ? setIsEditingH1(false) : setIsEditingH2(false);
  };

  const handleKeyDown = (e, half, value) => {
    if (e.key === 'Enter') onManualSave(half, value);
    if (e.key === 'Escape') half === 1 ? setIsEditingH1(false) : setIsEditingH2(false);
  };

  const handleEditEntry = (idx, entry) => {
    setEditingIndex(idx);
    setEditGameTime(entry.time);
    setEditVideoTime(formatiereZeit(getEstimatedVideoTime(entry)));
  };

  const handleSaveEdit = () => {
    if (editingIndex === -1) return;
    const entry = sortedLog[editingIndex];
    const originalLog = [...(currentGame.gameLog || [])];
    const entryIdx = originalLog.findIndex(e => e === entry);
    if (entryIdx !== -1) {
      originalLog[entryIdx] = { ...originalLog[entryIdx], time: editGameTime, videoTime: parseTime(editVideoTime) };
      const updated = { ...currentGame, gameLog: originalLog };
      setCurrentGame(updated);
      updateHistoryGame(updated);
    }
    setEditingIndex(-1);
  };

  const handleDeleteEntry = (idx) => {
    const entry = sortedLog[idx];
    const originalLog = (currentGame.gameLog || []).filter(e => e !== entry);
    const updated = { ...currentGame, gameLog: originalLog };
    setCurrentGame(updated);
    updateHistoryGame(updated);
    setEditingIndex(-1);
  };

  const handleToggleImportant = (idx) => {
    const entry = sortedLog[idx];
    const originalLog = [...(currentGame.gameLog || [])];
    const entryIdx = originalLog.findIndex(e => e === entry);
    if (entryIdx !== -1) {
      originalLog[entryIdx] = { ...originalLog[entryIdx], isImportant: !originalLog[entryIdx].isImportant };
      const updated = { ...currentGame, gameLog: originalLog };
      setCurrentGame(updated);
      updateHistoryGame(updated);
    }
  };

  const handleStartManualEvent = () => {
    setNewEventData({
      time: formatiereZeit(virtualGameTime),
      playerName: '',
      playerId: '',
      action: 'Tactical Note'
    });
    setIsAddingEvent(true);
  };

  const handleSaveManualEvent = () => {
    const newEntry = { ...newEventData, timestamp: new Date().toISOString(), isImportant: true, manual: true };
    const updatedLog = [...(currentGame.gameLog || []), newEntry];
    const updated = { ...currentGame, gameLog: updatedLog };
    setCurrentGame(updated);
    updateHistoryGame(updated);
    setIsAddingEvent(false);
    setNotification({ title: 'Event Added', message: `Marked at ${newEntry.time}` });
    setTimeout(() => setNotification(null), 3000);
  };

  // -- Render --
  return (
    <div className="relative min-h-screen">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`fixed transition-all duration-700 z-[9999] flex flex-col overflow-hidden border
          ${isCinemaMode 
            ? 'inset-0 p-8 bg-black border-transparent' 
            : 'top-[160px] left-[280px] right-6 bottom-6 p-5 rounded-[40px] border-white/5 bg-zinc-950 shadow-[0_40px_100px_rgba(0,0,0,0.8)]'
          }
        `}
      >
        <div className="flex items-center justify-between mb-4 bg-zinc-900/40 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-4">
            {onBack && !isCinemaMode && <Button variant="ghost" size="icon" icon={ArrowLeft} onClick={onBack} />}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Badge variant="brand" className="text-[7px]">PRO ANALYSIS</Badge>
                <h2 className="text-lg font-black uppercase italic text-white tracking-tight">
                  {currentGame?.teamHome || currentGame?.settings?.teamNameHeim || currentGame?.teams?.heim || 'Heim'} vs {currentGame?.teamAway || currentGame?.settings?.teamNameGegner || currentGame?.teams?.gegner || 'Gast'}
                </h2>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-bold">
            <span className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 text-zinc-400 font-mono tracking-wider">
              {formatDate(currentGame?.date)}
            </span>
            <Button 
              variant={isCinemaMode ? "destructive" : "ghost"} size="sm" 
              icon={isCinemaMode ? Minimize2 : Maximize2}
              onClick={() => setIsCinemaMode(!isCinemaMode)}
              className="text-[9px] h-8"
            >
              {isCinemaMode ? 'Exit Cinema' : 'Cinema Mode'}
            </Button>
          </div>
        </div>

        <div className="flex flex-row gap-5 flex-1 min-h-0">
          <div className="flex flex-col flex-1 gap-4 min-h-0">
            <VideoEngine 
              videoRef={videoRef} videoUrl={videoUrl} isPlaying={isPlaying} setIsPlaying={setIsPlaying}
              onFileClick={() => fileInputRef.current.click()} onTimeUpdate={setCurrentTime} onLoadedMetadata={setDuration}
            />
            <TacticalTimeline 
              virtualGameTime={virtualGameTime} currentTime={currentTime} duration={duration} sortedLog={sortedLog}
              getAbsTime={getAbsTime} seekToEntry={seekToEntry} getEstimatedVideoTime={getEstimatedVideoTime}
              isCinemaMode={isCinemaMode} isFocusMode={isFocusMode} onTimelineClick={(pct) => {
                const estimatedV = getEstimatedVideoTime(pct * 3600);
                if (videoRef.current && estimatedV !== null) videoRef.current.currentTime = estimatedV;
              }}
            />

            <div className="flex items-center gap-6 bg-zinc-900/60 backdrop-blur-md p-3 rounded-[28px] border border-white/5">
              <div className="flex items-center gap-1.5 bg-black/40 rounded-2xl border border-white/5 p-1">
                <Button variant="ghost" size="sm" icon={SkipBack} onClick={() => videoRef.current.currentTime -= 5} className="h-9 w-9 p-0" />
                <button 
                  onClick={() => isPlaying ? videoRef.current.pause() : videoRef.current.play()}
                  className="w-11 h-11 rounded-full bg-brand flex items-center justify-center text-black shadow-xl hover:scale-105 transition-all"
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>
                <Button variant="ghost" size="sm" icon={SkipForward} onClick={() => videoRef.current.currentTime += 5} className="h-9 w-9 p-0" />
              </div>

              <div className="flex items-center gap-3 bg-black/20 rounded-xl px-3 py-2">
                <Volume2 size={12} className="text-zinc-400" />
                <input 
                  type="range" min="0" max="1" step="0.1" value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-brand"
                />
              </div>

              <div className="flex items-center gap-3 bg-black/20 rounded-xl px-3 py-1.5 border border-white/5">
                <span className="text-[8px] font-black uppercase text-brand tracking-widest">Lead Time</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setLeadTime(Math.max(0, leadTime - 1))} className="w-5 h-5 flex items-center justify-center bg-white/5 rounded">-</button>
                  <span className="text-[10px] font-black w-3 text-center">{leadTime}</span>
                  <button onClick={() => setLeadTime(leadTime + 1)} className="w-5 h-5 flex items-center justify-center bg-white/5 rounded">+</button>
                </div>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-1 border border-white/5 group">
                  <Clock size={12} className={videoOffsets.h1 !== null ? 'text-brand' : 'text-zinc-600'} />
                  {isEditingH1 ? (
                    <div className="flex items-center gap-1">
                      <input 
                        autoFocus value={manualH1} onChange={(e) => setManualH1(e.target.value)}
                        onBlur={() => onManualSave(1, manualH1)} onKeyDown={(e) => handleKeyDown(e, 1, manualH1)}
                        className="bg-zinc-800 text-[10px] font-black text-brand w-14 outline-none px-1 rounded border border-brand/30"
                      />
                      <CheckCircle size={10} className="text-brand animate-pulse" />
                    </div>
                  ) : (
                    <span 
                      onClick={() => { setManualH1(formatiereZeit(videoOffsets.h1)); setIsEditingH1(true); }}
                      className="text-[10px] font-black text-zinc-100 cursor-pointer hover:text-brand"
                    >
                      {videoOffsets.h1 !== null ? `H1: ${formatiereZeit(videoOffsets.h1)}` : 'H1: --:--'}
                    </span>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setHalfOffset(1); }} className="p-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand hover:text-black transition-all opacity-0 group-hover:opacity-100"><CheckCircle size={12} /></button>
                </div>

                <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-1 border border-white/5 group">
                  <Clock size={12} className={videoOffsets.h2 !== null ? 'text-brand' : 'text-zinc-600'} />
                  {isEditingH2 ? (
                    <div className="flex items-center gap-1">
                      <input 
                        autoFocus value={manualH2} onChange={(e) => setManualH2(e.target.value)}
                        onBlur={() => onManualSave(2, manualH2)} onKeyDown={(e) => handleKeyDown(e, 2, manualH2)}
                        className="bg-zinc-800 text-[10px] font-black text-brand w-14 outline-none px-1 rounded border border-brand/30"
                      />
                      <CheckCircle size={10} className="text-brand animate-pulse" />
                    </div>
                  ) : (
                    <span 
                      onClick={() => { setManualH2(formatiereZeit(videoOffsets.h2)); setIsEditingH2(true); }}
                      className="text-[10px] font-black text-zinc-100 cursor-pointer hover:text-brand"
                    >
                      {videoOffsets.h2 !== null ? `H2: ${formatiereZeit(videoOffsets.h2)}` : 'H2: --:--'}
                    </span>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setHalfOffset(2); }} className="p-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand hover:text-black transition-all opacity-0 group-hover:opacity-100"><CheckCircle size={12} /></button>
                </div>

                <div className="h-8 w-[1px] bg-white/5 mx-1" />
                
                {isCinemaMode && (
                  <Button 
                    variant={isFocusMode ? "brand" : "ghost"} 
                    size="sm" 
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="h-8 px-3 text-[9px] uppercase font-black"
                  >
                    {isFocusMode ? 'Focus On' : 'Focus Mode'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <EventList 
            sortedLog={sortedLog} activeEntryIndex={activeEntryIndex} isPlaylistMode={isPlaylistMode} playlistIndex={playlistIndex} togglePlaylist={togglePlaylist}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterAction={filterAction} setFilterAction={setFilterAction}
            filterPlayer={filterPlayer} setFilterPlayer={setFilterPlayer} playerOptions={playerOptions}
            hideAdministrative={hideAdministrative} setHideAdministrative={setHideAdministrative} uniqueActions={uniqueActions}
            onEntryClick={seekToEntry} onEditEntry={handleEditEntry} editingIndex={editingIndex} setEditingIndex={setEditingIndex}
            editGameTime={editGameTime} setEditGameTime={setEditGameTime} editVideoTime={editVideoTime} setEditVideoTime={setEditVideoTime}
            onSaveEdit={handleSaveEdit} onDeleteEntry={handleDeleteEntry} onToggleImportant={handleToggleImportant}
            videoRef={videoRef} protocolListRef={protocolListRef} isCinemaMode={isCinemaMode} isFocusMode={isFocusMode}
            isAddingEvent={isAddingEvent} setIsAddingEvent={setIsAddingEvent} newEventData={newEventData} setNewEventData={setNewEventData}
            handleSaveManualEvent={handleSaveManualEvent} onStartManualEvent={handleStartManualEvent}
          />
        </div>
      </motion.div>
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-1 bg-brand text-black px-6 py-3 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-2"><CheckCircle size={16} /><span className="text-[11px] font-black uppercase tracking-wider">{notification.title}</span></div>
            <span className="text-[9px] font-bold opacity-80">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />
    </div>
  );
};

export default VideoAnalysisTab;
