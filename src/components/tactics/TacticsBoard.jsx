import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import HandballField from './parts/HandballField';
import DraggablePlayer from './parts/DraggablePlayer';
import TacticsToolbar from './parts/TacticsToolbar';
import TacticsPath from './parts/TacticsPath';
import { Layout, Play, Pause, ChevronLeft, ChevronRight, Plus, Trash2, X, Save, FolderOpen } from 'lucide-react';
import useStore from '../../store/useStore';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

const INITIAL_PLAYERS = [
  { id: 'ball', x: 48, y: 53, color: 'ball', number: '', label: '' },
  { id: 'h1', x: 2.5, y: 50, color: 'defense', number: 'TW', label: '' },
  { id: 'h2', x: 12, y: 88, color: 'defense', number: '1', label: '' },
  { id: 'h3', x: 17, y: 72, color: 'defense', number: '2', label: '' },
  { id: 'h4', x: 20, y: 56, color: 'defense', number: '3', label: '' },
  { id: 'h5', x: 20, y: 44, color: 'defense', number: '4', label: '' },
  { id: 'h6', x: 17, y: 28, color: 'defense', number: '5', label: '' },
  { id: 'h7', x: 12, y: 12, color: 'defense', number: '6', label: '' },
  { id: 'a1', x: 96, y: 50, color: 'attack', number: 'TW', label: '' },
  { id: 'a2', x: 12, y: 96, color: 'attack', number: '1', label: '' },
  { id: 'a3', x: 38, y: 85, color: 'attack', number: '2', label: '' },
  { id: 'a4', x: 45, y: 50, color: 'attack', number: '3', label: '' },
  { id: 'a5', x: 38, y: 15, color: 'attack', number: '4', label: '' },
  { id: 'a6', x: 12, y: 4, color: 'attack', number: '5', label: '' },
  { id: 'a7', x: 15, y: 55, color: 'attack', number: '6', label: '' },
];

const MemoizedPlayer = memo(DraggablePlayer);
const MemoizedPath = memo(TacticsPath);

const TacticsBoard = () => {
  const { tacticsPlays: savedPlays, addTacticsPlay, removeTacticsPlay, setTacticsPlays, activeMember, squad } = useStore();
  
  // Permissions
  const myUid = activeMember?.uid || '';
  const isOwner = myUid === (squad?.ownerUid || '');
  const isTrainer = (activeMember?.role === 'trainer') || isOwner;
  const canDeletePlays = isTrainer;

  const constraintsRef = useRef(null);
  const [frames, setFrames] = useState([INITIAL_PLAYERS]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, playerId: null });

  const players = frames[currentFrame] || INITIAL_PLAYERS;
  const previousPlayers = currentFrame > 0 ? frames[currentFrame - 1] : null;

  // Migration logic
  useEffect(() => {
    const legacy = localStorage.getItem('handball_tactics_v2_plays');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed.length > 0 && savedPlays.length === 0) {
          setTacticsPlays(parsed);
          localStorage.removeItem('handball_tactics_v2_plays');
        }
      } catch (e) { console.error("Tactics migration failed", e); }
    }
  }, [savedPlays, setTacticsPlays]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  const addFrame = useCallback(() => {
    setFrames(prev => {
      const newFrames = [...prev];
      const currentPlayerSet = newFrames[currentFrame].map(p => ({ ...p, curve: { x: 0, y: 0 } }));
      newFrames.splice(currentFrame + 1, 0, currentPlayerSet);
      return newFrames;
    });
    setCurrentFrame(prev => prev + 1);
  }, [currentFrame]);

  const removeFrame = useCallback(() => {
    if (frames.length <= 1) return;
    setFrames(prev => prev.filter((_, i) => i !== currentFrame));
    setCurrentFrame(prev => Math.max(0, prev - 1));
  }, [currentFrame, frames.length]);

  const addManualPlayer = useCallback((color) => {
    const newPlayer = { id: `manual-${Date.now()}`, x: 50, y: 50, color, number: '+', label: '' };
    setFrames(prev => prev.map((frame, i) => i >= currentFrame ? [...frame, newPlayer] : frame));
  }, [currentFrame]);

  const updatePlayerPos = useCallback((id, pos) => {
    setFrames(prev => {
      const currentPlayers = prev[currentFrame];
      const target = currentPlayers.find(p => p.id === id);
      if (target && target.x === pos.x && target.y === pos.y) return prev;
      
      const newFrames = [...prev];
      newFrames[currentFrame] = currentPlayers.map(p => p.id === id ? { ...p, ...pos } : p);
      return newFrames;
    });
  }, [currentFrame]);

  const updatePlayerCurve = useCallback((id, curve) => {
    setFrames(prev => {
      const currentPlayers = prev[currentFrame];
      const target = currentPlayers.find(p => p.id === id);
      if (target && target.curve?.x === curve.x && target.curve?.y === curve.y) return prev;

      const newFrames = [...prev];
      newFrames[currentFrame] = currentPlayers.map(p => p.id === id ? { ...p, curve } : p);
      return newFrames;
    });
  }, [currentFrame]);

  const updatePlayerData = useCallback((id, data) => {
    setFrames(prev => prev.map(frame => frame.map(p => p.id === id ? { ...p, ...data } : p)));
  }, []);

  const removePlayer = useCallback((id) => {
    setFrames(prev => prev.map(frame => frame.filter(p => p.id !== id)));
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const handleContextMenu = useCallback((e, playerId) => {
    if (!constraintsRef.current) return;
    const rect = constraintsRef.current.getBoundingClientRect();
    setContextMenu({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, playerId });
  }, []);

  const handleSave = () => {
    if (!saveName) return;
    const newPlay = { id: Date.now(), name: saveName, frames, date: new Date().toLocaleDateString() };
    addTacticsPlay(newPlay);
    setShowSaveModal(false);
    setSaveName('');
  };

  const loadPlay = (play) => {
    setFrames(play.frames);
    setCurrentFrame(0);
    setShowLoadModal(false);
  };

  const deletePlay = (id) => {
    if (!canDeletePlays) return;
    removeTacticsPlay(id);
  };

  const resetBoard = useCallback(() => {
    setFrames([INITIAL_PLAYERS]);
    setCurrentFrame(0);
    setIsPlaying(false);
  }, []);

  const selectedPlayer = players.find(p => p.id === contextMenu.playerId);

  return (
    <div className="flex flex-col gap-6 p-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto" onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand/10 border border-brand/20 rounded-2xl"><Layout size={20} className="text-brand" /></div>
          <div><h2 className="text-xl font-black tracking-tighter uppercase italic text-zinc-100">Taktikboard</h2><p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Strategische Planung</p></div>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800 backdrop-blur-md">
          <div className="flex items-center gap-1 pr-4 border-r border-zinc-800">
            <button onClick={() => setCurrentFrame(prev => Math.max(0, prev - 1))} disabled={currentFrame === 0} className="p-2 text-zinc-500 hover:text-zinc-100 disabled:opacity-20 transition-all"><ChevronLeft size={18} /></button>
            <div className="px-3 flex flex-col items-center min-w-[60px]"><span className="text-[10px] font-black text-brand italic">PHASE</span><span className="text-xs font-black text-zinc-100 tabular-nums">{currentFrame + 1} / {frames.length}</span></div>
            <button onClick={() => setCurrentFrame(prev => Math.min(frames.length - 1, prev + 1))} disabled={currentFrame === frames.length - 1} className="p-2 text-zinc-500 hover:text-zinc-100 disabled:opacity-20 transition-all"><ChevronRight size={18} /></button>
          </div>
          <div className="flex items-center gap-2">
            {canDeletePlays && (
              <button onClick={removeFrame} disabled={frames.length <= 1} className="p-2 text-zinc-600 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
            )}
            <button onClick={addFrame} className="p-2 bg-zinc-800 text-zinc-300 hover:text-brand hover:bg-brand/10 rounded-xl transition-all border border-zinc-700"><Plus size={18} /></button>
            <Button 
              onClick={() => setIsPlaying(!isPlaying)} 
              variant={isPlaying ? "ghost" : "brand"}
              className={`px-5 py-2 text-[10px] ${isPlaying ? 'text-red-500 border-red-500/20 bg-red-500/10 hover:bg-red-500/20' : ''}`}
            >
              {isPlaying ? <><Pause size={14} fill="currentColor" className="mr-2" /> Stop</> : <><Play size={14} fill="currentColor" className="mr-2" /> Play</>}
            </Button>
          </div>
        </div>
        <TacticsToolbar onAddPlayer={addManualPlayer} onClear={() => setFrames([[INITIAL_PLAYERS[0]]])} onReset={resetBoard} onSave={() => setShowSaveModal(true)} onLoad={() => setShowLoadModal(true)} />
      </div>

      <div className="relative w-full aspect-[40/20] select-none shadow-2xl bg-zinc-950 rounded-[2.5rem] overflow-hidden border border-zinc-800/50" ref={constraintsRef}>
        <HandballField />
        {!isPlaying && previousPlayers && players.map(player => {
          const prevPos = previousPlayers.find(p => p.id === player.id);
          if (!prevPos || (prevPos.x === player.x && prevPos.y === player.y)) return null;
          return <MemoizedPath key={`path-${player.id}`} start={prevPos} end={player} curve={player.curve} color={player.color} onCurveChange={(curve) => updatePlayerCurve(player.id, curve)} constraintsRef={constraintsRef} />;
        })}
        {players.map(player => (
          <MemoizedPlayer key={player.id} {...player} prevPos={previousPlayers?.find(p => p.id === player.id)} constraintsRef={constraintsRef} onUpdate={updatePlayerPos} onContextMenu={handleContextMenu} />
        ))}
        {contextMenu.visible && selectedPlayer && (
          <div className="absolute z-[100] w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 animate-in zoom-in-95 duration-200" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nummer</label><Input type="text" value={selectedPlayer.number} onChange={(e) => updatePlayerData(selectedPlayer.id, { number: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Name</label><Input type="text" value={selectedPlayer.label} placeholder="Spieler Name..." onChange={(e) => updatePlayerData(selectedPlayer.id, { label: e.target.value })} /></div>
              <button onClick={() => removePlayer(selectedPlayer.id)} className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all active:scale-95 mt-2"><Trash2 size={14} /> Entfernen</button>
            </div>
          </div>
        )}
      </div>

      {showSaveModal && (
        <Modal 
          isOpen={showSaveModal} 
          onClose={() => setShowSaveModal(false)}
          title="Spielzug speichern"
          size="sm"
        >
          <div className="space-y-6">
            <Input 
              autoFocus 
              placeholder="z.B. Schnelle Mitte" 
              value={saveName} 
              onChange={(e) => setSaveName(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="text-lg"
            />
            <div className="flex gap-3">
              <Button onClick={() => setShowSaveModal(false)} variant="ghost" className="flex-1">Abbrechen</Button>
              <Button onClick={handleSave} disabled={!saveName} variant="brand" className="flex-1">Speichern</Button>
            </div>
          </div>
        </Modal>
      )}

      {showLoadModal && (
        <Modal 
          isOpen={showLoadModal} 
          onClose={() => setShowLoadModal(false)}
          title="Gespeicherte Spielzüge"
          size="md"
        >
          <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-2 no-scrollbar p-1">
            {(!savedPlays || savedPlays.length === 0) ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <FolderOpen size={48} className="text-zinc-800" />
                <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Keine Spielzüge gefunden</p>
              </div>
            ) : (
              savedPlays.map(play => (
                <div key={play.id} className="group flex items-center justify-between p-4 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-800 rounded-2xl transition-all">
                  <div className="cursor-pointer flex-1" onClick={() => loadPlay(play)}>
                    <h4 className="text-sm font-black text-zinc-200 group-hover:text-brand transition-colors">{play.name}</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-widest">{play.frames.length} Phasen • {play.date}</p>
                  </div>
                  {canDeletePlays && (
                    <button onClick={(e) => { e.stopPropagation(); deletePlay(play.id); }} className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  )}
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TacticsBoard;
