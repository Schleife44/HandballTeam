import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Clock, Zap, Star, Settings2, CheckCircle, 
  Trash2, ArrowLeft, ChevronDown, User, Target, Play, SkipForward, Plus, X, Pause
} from 'lucide-react';
import { formatiereZeit, parseTime } from '../../../../utils/timeUtils';
import Input from '../../../ui/Input';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';

const CustomDropdown = ({ value, options, onChange, icon: Icon, label, placeholder, small }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative flex-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-black/40 border border-white/5 rounded-xl px-2 flex items-center justify-between group hover:bg-black/60 transition-all outline-none focus:border-brand/40 ${small ? 'h-8' : 'h-10'}`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Icon size={10} className="text-zinc-500 group-hover:text-brand transition-colors flex-shrink-0" />
          <span className="text-[8px] uppercase font-black text-zinc-400 truncate">
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown size={10} className={`text-zinc-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[101] overflow-hidden py-1 max-h-[200px] overflow-y-auto custom-scrollbar"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-[8px] uppercase font-black transition-all flex items-center gap-2
                    ${value === opt.value ? 'bg-brand text-black' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  {opt.icon && <opt.icon size={8} />}
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const EventList = ({
  sortedLog,
  activeEntryIndex,
  searchTerm,
  setSearchTerm,
  filterAction,
  setFilterAction,
  filterPlayer,
  setFilterPlayer,
  playerOptions = [],
  hideAdministrative,
  setHideAdministrative,
  uniqueActions,
  onEntryClick,
  onEditEntry,
  editingIndex,
  setEditingIndex,
  editGameTime,
  setEditGameTime,
  editVideoTime,
  setEditVideoTime,
  onSaveEdit,
  onDeleteEntry,
  onToggleImportant,
  videoRef,
  protocolListRef,
  isCinemaMode,
  isFocusMode,
  isPlaylistMode,
  playlistIndex,
  togglePlaylist,
  isAddingEvent,
  setIsAddingEvent,
  newEventData,
  setNewEventData,
  handleSaveManualEvent,
  onStartManualEvent
}) => {
  
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(-1);

  const actionOptions = [
    { value: 'all', label: 'Alle Aktionen', icon: Filter },
    { value: 'important', label: 'Wichtig (Stern)', icon: Star },
    { value: 'all_goals', label: 'Alle Tore', icon: Target },
    { value: 'home_goals', label: 'Heim Tore', icon: Target },
    { value: 'away_goals', label: 'Gast Tore', icon: Target },
    ...uniqueActions
      .filter(a => !['timeout', 'halbzeit', 'spielende', 'start', 'period'].some(t => a.toLowerCase().includes(t)))
      .map(a => ({ value: a, label: a, icon: Target }))
  ];

  const playerDropdownOptions = [
    { value: 'all', label: 'Alle Spieler', icon: User },
    ...playerOptions.map(p => ({ value: p.id, label: p.name, icon: User }))
  ];

  const manualPlayerOptions = [
    { id: '', name: 'General / No Player' },
    ...playerOptions
  ];

  // Auto-scroll logic
  React.useEffect(() => {
    const activeIdx = isPlaylistMode ? playlistIndex : activeEntryIndex;
    if (activeIdx !== -1 && protocolListRef.current) {
      const activeEl = protocolListRef.current.querySelector(`[data-event-index="${activeIdx}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeEntryIndex, playlistIndex, isPlaylistMode, protocolListRef]);

  return (
    <div className={`flex flex-col gap-4 min-h-0 transition-all duration-700 ease-in-out ${isFocusMode ? 'w-[20%]' : (isCinemaMode ? 'w-[28%]' : 'w-[35%]')}`}>
      <Card noPadding className="flex flex-col h-full bg-zinc-900/20 backdrop-blur-md border-white/5 rounded-[32px] overflow-hidden">
        {/* Header & Filters */}
        <div className="p-4 border-b border-white/5 space-y-3 bg-black/20">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-10 h-10 bg-black/40 border-white/5 text-[10px] uppercase font-black focus:border-brand/40"
              />
            </div>
            <div className="flex gap-1">
              <Button 
                variant={isPlaylistMode ? "destructive" : "primary"} 
                size="sm" 
                icon={isPlaylistMode ? Pause : Play} 
                onClick={togglePlaylist}
                className="h-10 px-4 text-[9px]"
                title="Watch Highlights"
              >
                {isPlaylistMode ? 'Stop' : 'Play Clips'}
              </Button>
              <Button 
                variant="brand" 
                size="sm" 
                icon={Plus} 
                onClick={onStartManualEvent}
                className="h-10 w-10 p-0 shadow-[0_0_20px_rgba(132,204,22,0.2)]"
                title="Mark Moment"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CustomDropdown 
              value={filterAction}
              options={actionOptions}
              onChange={setFilterAction}
              icon={Filter}
              placeholder="Action"
              small
            />
            <CustomDropdown 
              value={filterPlayer}
              options={playerDropdownOptions}
              onChange={setFilterPlayer}
              icon={User}
              placeholder="Player"
              small
            />
            <button 
              onClick={() => setHideAdministrative(!hideAdministrative)}
              className={`px-3 h-8 rounded-xl border transition-all text-[8px] uppercase font-black flex items-center justify-center gap-1.5 flex-shrink-0
                ${hideAdministrative ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-white/5 border-white/5 text-zinc-500'}
              `}
            >
              <Clock size={10} /> {hideAdministrative ? 'Meta Hidden' : 'Show All'}
            </button>
          </div>
        </div>

        {/* List */}
        <div ref={protocolListRef} className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {/* Inline Add Form */}
            {isAddingEvent && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-brand/5 border border-brand/20 rounded-2xl mb-2 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="brand" className="text-[7px]">NEW MARKER</Badge>
                  <input 
                    value={newEventData.time}
                    onChange={(e) => setNewEventData({ ...newEventData, time: e.target.value })}
                    className="w-16 h-7 bg-black/60 border border-brand/20 rounded text-[10px] font-bold text-center text-brand outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <select 
                    value={newEventData.playerId}
                    onChange={(e) => {
                      const p = manualPlayerOptions.find(opt => opt.id === e.target.value);
                      setNewEventData({ ...newEventData, playerId: e.target.value, playerName: p?.name === 'General / No Player' ? '' : (p?.name || '') });
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 h-9 text-[10px] uppercase font-black text-white outline-none"
                  >
                    {manualPlayerOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <Input 
                    value={newEventData.action}
                    onChange={(e) => setNewEventData({ ...newEventData, action: e.target.value })}
                    placeholder="Note..."
                    className="h-9 bg-black/40 border-white/10 text-[10px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1 h-8 text-[8px]" onClick={() => setIsAddingEvent(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" className="flex-1 h-8 text-[8px]" onClick={handleSaveManualEvent} icon={CheckCircle}>Add</Button>
                </div>
              </motion.div>
            )}

            {sortedLog.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-zinc-700"
              >
                <Search size={32} className="mb-2 opacity-20" />
                <p className="text-[9px] font-black uppercase tracking-widest">No matching events</p>
              </motion.div>
            ) : sortedLog.map((entry, idx) => {
              const isActive = idx === activeEntryIndex;
              const isPlaylistActive = isPlaylistMode && idx === playlistIndex;
              const isEditing = editingIndex === idx;

              if (isEditing) {
                return (
                  <motion.div 
                    layout key={`edit-${idx}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-brand/10 border border-brand/30 rounded-2xl space-y-4 relative overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <label className="text-[7px] uppercase font-black text-brand tracking-widest">Match Time</label>
                        <input 
                          value={editGameTime}
                          onChange={(e) => setEditGameTime(e.target.value)}
                          className="w-16 h-8 bg-black/60 border border-brand/20 rounded text-[10px] font-bold text-center text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <label className="text-[7px] uppercase font-black text-zinc-500 tracking-widest">Video Pos</label>
                        <div className="flex items-center bg-black/60 rounded border border-white/10 h-8 overflow-hidden">
                          <input 
                            value={editVideoTime}
                            onChange={(e) => setEditVideoTime(e.target.value)}
                            className="w-14 text-[9px] font-mono text-center bg-transparent border-none outline-none"
                          />
                          <button 
                            onClick={() => setEditVideoTime(formatiereZeit(videoRef.current?.currentTime || 0))}
                            className="h-full px-1.5 bg-brand/10 hover:bg-brand hover:text-black transition-all"
                          >
                            <Clock size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="primary" size="sm" className="flex-1 h-9" onClick={onSaveEdit} icon={CheckCircle}>Save</Button>
                      <button 
                        onClick={() => onToggleImportant(idx)}
                        className={`p-2 rounded-xl border transition-all ${entry.isImportant ? 'bg-brand border-brand text-black' : 'bg-black/40 border-white/10 text-zinc-500'}`}
                      >
                        <Star size={14} fill={entry.isImportant ? 'black' : 'none'} />
                      </button>
                      
                      <div className="relative">
                        {deleteConfirmIndex === idx ? (
                          <div className="flex items-center gap-1 bg-red-500 rounded-xl p-1 animate-in slide-in-from-right-2">
                            <button onClick={() => { onDeleteEntry(idx); setDeleteConfirmIndex(-1); }} className="px-2 py-1 text-[8px] font-black uppercase text-white">Delete</button>
                            <button onClick={() => setDeleteConfirmIndex(-1)} className="p-1 text-white/50"><X size={10} /></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirmIndex(idx)}
                            className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <button onClick={() => setEditingIndex(-1)} className="p-2 text-zinc-500 hover:text-white"><ArrowLeft size={14} /></button>
                    </div>
                  </motion.div>
                );
              }

              const isAnyActive = isActive || isPlaylistActive;

              return (
                <motion.div 
                  layout
                  key={entry.timestamp || idx}
                  data-event-index={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                  onClick={() => onEntryClick(entry)}
                  className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border
                    ${isAnyActive
                      ? 'bg-brand text-black border-brand shadow-[0_10px_30px_rgba(132,204,22,0.3)] scale-[1.02] z-10'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/5 text-zinc-400'
                    }
                  `}
                >
                  <div className={`w-10 text-[9px] font-black tabular-nums italic ${isAnyActive ? 'text-black/60' : 'text-zinc-600'}`}>
                    {entry.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase truncate ${isAnyActive ? 'text-black' : 'text-zinc-100'}`}>
                        {entry.action}
                      </span>
                      {entry.isImportant && <Star size={10} fill={isAnyActive ? 'black' : '#eab308'} stroke="none" />}
                    </div>
                    <div className={`text-[8px] font-bold uppercase truncate ${isAnyActive ? 'text-black/60' : 'text-zinc-500'}`}>
                      {entry.playerName || `Spieler #${entry.playerNumber || '?'}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditEntry(idx, entry); }}
                      className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isAnyActive ? 'text-black hover:bg-black/10' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                      <Settings2 size={12} />
                    </button>
                    <motion.div animate={{ x: isAnyActive ? 0 : 5, opacity: isAnyActive ? 1 : 0 }}>
                      <Zap size={14} className={isAnyActive ? 'text-black' : 'text-brand'} />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};

export default EventList;
