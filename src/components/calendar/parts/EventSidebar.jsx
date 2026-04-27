import React, { useState } from 'react';
import { format, isSameDay, addMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Trophy, 
  Dumbbell, 
  Edit2, 
  Trash2, 
  Users, 
  X, 
  CheckCircle2, 
  XCircle, 
  HelpCircle as QuestionIcon,
  Calendar as CalendarIcon,
  MessageSquare,
  ZapOff,
  Plus,
  AlertCircle,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../../store/useStore';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

const EventSidebar = ({ 
  selectedDate, 
  events, 
  expandedEventId, 
  setExpandedEventId, 
  handleUpdateStatus, 
  setEventData, 
  setActiveModal, 
  setConfirmDelete,
  settings,
  setFormError
}) => {
  const dayEvents = events.filter(e => isSameDay(new Date(e.date), selectedDate));
  
  const [pendingEventId, setPendingEventId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [reason, setReason] = useState('');
  const [trainerAction, setTrainerAction] = useState(null); // { eventId, playerName, currentStatus }
  
  const { activeMember, squad } = useStore();

  const myName = activeMember?.playerName;
  const myUid = activeMember?.uid;
  const ownerUid = squad?.ownerUid;
  const isTrainer = activeMember?.role === 'trainer' || myUid === ownerUid;

  function sortResponses(responses) {
    if (!responses) return [];
    const order = { 'going': 1, 'maybe': 2, 'declined': 3 };
    return [...responses].sort((a, b) => order[a.status] - order[b.status]);
  }

  const getDeadlineInfo = (event) => {
    const deadlineHours = event.deadline !== undefined ? event.deadline : settings?.absageDeadline;
    if (!deadlineHours) return { isPast: false, deadlineDate: null };
    
    const eventDate = new Date(event.date);
    const deadlineDate = new Date(eventDate.getTime() - deadlineHours * 60 * 60 * 1000);
    return { isPast: new Date() > deadlineDate, deadlineDate };
  };

  const handleStatusClick = (eventId, status) => {
    const event = events.find(e => e.id === eventId);
    const requiresReason = event?.isMandatory !== undefined ? event.isMandatory : settings?.absageGrundPflicht;
    const { isPast } = getDeadlineInfo(event);
    
    if (isPast && !isTrainer && status !== 'going') return;

    if (status === 'going') {
      handleUpdateStatus(eventId, 'going');
      setPendingEventId(null);
      setPendingStatus(null);
    } else if (requiresReason === true) {
      setPendingEventId(eventId);
      setPendingStatus(status);
      setExpandedEventId(null);
    } else {
      handleUpdateStatus(eventId, status);
    }
  };

  const executeTrainerAction = (status, customReason = '') => {
    if (!trainerAction) return;
    handleUpdateStatus(trainerAction.eventId, status, customReason, trainerAction.playerName);
    setTrainerAction(null);
    setReason('');
  };

  function handleSubmitReason(eventId) {
    handleUpdateStatus(eventId, pendingStatus, reason);
    setPendingEventId(null);
    setPendingStatus(null);
    setReason('');
  }

  return (
    <aside className="w-full lg:w-[28.5rem] p-8 flex flex-col gap-6 bg-zinc-950/40 border-t lg:border-t-0 border-zinc-900 relative overflow-y-auto no-scrollbar scroll-smooth">
      {/* Header */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedEventId ? 'max-h-0 opacity-0 mb-0 pointer-events-none' : 'max-h-[200px] opacity-100 mb-4'}`}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-8 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-brand" /> Tagesansicht
        </h3>
        <div className="flex flex-col gap-2">
          <span className="text-4xl font-black italic uppercase tracking-tighter text-zinc-100">
            {format(selectedDate, 'eeee', { locale: de })}
          </span>
          <span className="text-zinc-600 font-bold text-sm tracking-[0.2em] uppercase">
            {format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-6 relative">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
             <div className="p-6 bg-zinc-900/50 rounded-[2.5rem] border border-zinc-800/50 mb-6">
                <ZapOff size={32} className="text-zinc-700" />
             </div>
             <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">Keine Termine</h4>
             <button 
              onClick={() => {
                setEventData({ title: '', type: 'Training', date: format(selectedDate, 'yyyy-MM-dd'), time: '19:00', meetingTime: '', location: '', repeat: 'Keine', endDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd'), isMandatory: true, isAutoGoing: true, deadline: 2 });
                setActiveModal('event');
              }}
              className="mt-8 flex items-center gap-2 px-6 py-3 bg-brand rounded-2xl text-[10px] font-black uppercase text-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)] active:scale-95"
             >
               <Plus size={14} strokeWidth={3} /> Termin hinzufügen
             </button>
          </div>
        ) : (
          dayEvents.map((event, idx) => {
            const myStatus = event.responses?.[myName]?.status;
            const isExpanded = expandedEventId === event.id;
            const isPending = pendingEventId === event.id;
            const { isPast, deadlineDate } = getDeadlineInfo(event);
            
            const responseList = Object.entries(event.responses || {}).map(([name, data]) => ({ name, ...data }));
            const goingCount = responseList.filter(r => r.status === 'going').length;
            const maybeCount = responseList.filter(r => r.status === 'maybe').length;
            const declinedCount = responseList.filter(r => r.status === 'declined' || r.status === 'not-going').length;

            if (expandedEventId && !isExpanded) return null;

            return (
              <div key={idx} className={`p-6 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-900/50 space-y-4 transition-all duration-500 ${isExpanded ? 'bg-zinc-900/60 shadow-2xl scale-[1.02]' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl 
                      ${event.type?.toUpperCase() === 'SPIEL' ? 'bg-red-500/10 text-red-500' : 
                        event.type?.toUpperCase() === 'TRAINING' ? 'bg-blue-500/10 text-blue-500' : 
                        'bg-amber-500/10 text-amber-500'}`}>
                      {event.type?.toUpperCase() === 'SPIEL' ? <Trophy size={20} /> : 
                       event.type?.toUpperCase() === 'TRAINING' ? <Dumbbell size={20} /> : 
                       <CalendarIcon size={20} />}
                    </div>
                    <div>
                      <h4 className="text-base font-black tracking-tight">{event.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em]">{event.type}</span>
                        <span className="text-[9px] font-black text-brand bg-brand/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{event.time} Uhr</span>
                      </div>
                    </div>
                  </div>
                  {isTrainer && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEventData({ id: event.id, title: event.title, type: event.type, date: format(new Date(event.date), 'yyyy-MM-dd'), time: event.time, meetingTime: event.meetingTime, location: event.location, repeat: 'Keine', isMandatory: event.isMandatory, isAutoGoing: event.isAutoGoing, deadline: event.deadline });
                          setActiveModal('event');
                        }}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-600 hover:text-zinc-300 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete({ type: 'event', id: event.id, title: event.title })} className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>

                {isPast && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertCircle size={12} className="text-amber-500" />
                    <span className="text-[8px] font-black uppercase text-amber-500/80 tracking-widest">
                      Frist abgelaufen ({format(deadlineDate, 'HH:mm')} Uhr)
                    </span>
                  </div>
                )}

                <div className="flex items-stretch gap-1 p-1 bg-black/20 rounded-[1.25rem] border border-zinc-900/50 h-16">
                  <button onClick={() => handleStatusClick(event.id, 'going')} className={`flex-1 flex flex-col items-center justify-center rounded-xl transition-all border ${myStatus === 'going' ? 'bg-brand/10 border-brand text-brand' : 'border-transparent text-zinc-500 hover:bg-zinc-900/50'}`}>
                    <span className="text-lg font-black leading-none">{goingCount}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest mt-1">Dabei</span>
                  </button>
                  <button 
                    onClick={() => handleStatusClick(event.id, 'maybe')} 
                    disabled={isPast && !isTrainer}
                    className={`flex-1 flex flex-col items-center justify-center rounded-xl transition-all border 
                      ${myStatus === 'maybe' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'border-transparent text-zinc-500 hover:bg-zinc-900/50'}
                      ${isPast && !isTrainer ? 'opacity-20 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-lg font-black leading-none">{maybeCount}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest mt-1">Offen</span>
                  </button>
                  <button 
                    onClick={() => handleStatusClick(event.id, 'declined')} 
                    disabled={isPast && !isTrainer}
                    className={`flex-1 flex flex-col items-center justify-center rounded-xl transition-all border 
                      ${myStatus === 'declined' ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-transparent text-zinc-500 hover:bg-zinc-900/50'}
                      ${isPast && !isTrainer ? 'opacity-20 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-lg font-black leading-none">{declinedCount}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest mt-1">Absagen</span>
                  </button>
                  <button onClick={() => { setExpandedEventId(isExpanded ? null : event.id); setPendingEventId(null); }} className={`w-12 flex items-center justify-center rounded-xl transition-all border ${isExpanded ? 'bg-white text-black' : 'text-zinc-700 hover:bg-zinc-900/50'}`}>
                    {isExpanded ? <X size={16} strokeWidth={3} /> : <Users size={16} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="space-y-1.5 pt-2 animate-in slide-in-from-top-2 duration-300 max-h-[400px] overflow-y-auto no-scrollbar">
                    {sortResponses(responseList).map((res, i) => (
                      <div key={i} className="group/row flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <div className="flex items-center gap-3">
                          <div 
                            className={`transition-all ${isTrainer ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
                            onClick={() => isTrainer && setTrainerAction({ eventId: event.id, playerName: res.name, currentStatus: res.status })}
                          >
                            {res.status === 'going' ? <CheckCircle2 size={12} className="text-brand" /> : res.status === 'declined' ? <XCircle size={12} className="text-red-500" /> : <QuestionIcon size={12} className="text-zinc-600" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-300">{res.name}</p>
                            {res.status === 'declined' && res.reason && (
                              <p className="text-[8px] font-medium text-zinc-500 italic mt-0.5">{res.reason}</p>
                            )}
                          </div>
                        </div>
                        {isTrainer && (
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setTrainerAction({ eventId: event.id, playerName: res.name, currentStatus: res.status })}
                                className="p-1.5 opacity-0 group-hover/row:opacity-100 hover:bg-zinc-800 text-zinc-600 hover:text-white rounded-md transition-all"
                              >
                                <ChevronDown size={12} />
                              </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Trainer Override Modal (Replacement for browser prompt) */}
      <Modal
        isOpen={!!trainerAction}
        onClose={() => setTrainerAction(null)}
        title={`${trainerAction?.playerName} ummelden`}
        size="sm"
        footer={
          <div className="flex gap-4 w-full">
            <Button variant="ghost" className="flex-1" onClick={() => setTrainerAction(null)}>Abbrechen</Button>
            <Button variant="brand" className="flex-1" onClick={() => executeTrainerAction(pendingStatus || 'declined', reason)}>Speichern</Button>
          </div>
        }
      >
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-2 p-1 bg-black/40 rounded-2xl border border-zinc-800">
            {['going', 'maybe', 'declined'].map((s) => (
              <button
                key={s}
                onClick={() => setPendingStatus(s)}
                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border
                  ${(pendingStatus || trainerAction?.currentStatus) === s 
                    ? s === 'going' ? 'bg-brand/10 border-brand text-brand' : s === 'maybe' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-red-500/10 border-red-500 text-red-500'
                    : 'border-transparent text-zinc-600 hover:bg-zinc-800'}`}
              >
                {s === 'going' ? 'Dabei' : s === 'maybe' ? 'Unsicher' : 'Absage'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Grund (Optional)</label>
            <input 
              type="text" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z.B. Trainer-Entscheid..."
              className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-xs text-white outline-none focus:border-brand transition-all"
            />
          </div>
        </div>
      </Modal>

      {/* Original Pending Reason UI for self-actions */}
      <AnimatePresence>
        {!!pendingEventId && (
          <Modal
            isOpen={!!pendingEventId}
            onClose={() => { setPendingEventId(null); setPendingStatus(null); }}
            title={pendingStatus === 'maybe' ? 'Unsicher?' : 'Grund der Absage'}
            size="sm"
            footer={
              <div className="flex gap-4 w-full">
                <Button variant="ghost" className="flex-1" onClick={() => { setPendingEventId(null); setPendingStatus(null); }}>Abbrechen</Button>
                <Button variant="primary" className="flex-1" disabled={!reason.trim()} onClick={() => handleSubmitReason(pendingEventId)}>Bestätigen</Button>
              </div>
            }
          >
             <div className="py-4 space-y-4">
               <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed tracking-wider">
                 Bitte gib einen kurzen Grund an, damit der Trainer Bescheid weiß.
               </p>
               <input 
                autoFocus 
                type="text" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && reason.trim() && handleSubmitReason(pendingEventId)} 
                placeholder="z.B. Arbeit, Krank..." 
                className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-xs text-white outline-none focus:border-brand transition-all" 
              />
             </div>
          </Modal>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default EventSidebar;
