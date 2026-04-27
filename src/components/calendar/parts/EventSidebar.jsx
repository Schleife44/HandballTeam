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
  Plus
} from 'lucide-react';
import useStore from '../../../store/useStore';

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
  
  // State for the reason input
  const [pendingEventId, setPendingEventId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [reason, setReason] = useState('');
  const { activeMember } = useStore();

  const myName = activeMember?.playerName;

  function sortResponses(responses) {
    if (!responses) return [];
    const order = { 'going': 1, 'maybe': 2, 'declined': 3 };
    return [...responses].sort((a, b) => order[a.status] - order[b.status]);
  }

  const handleStatusClick = (eventId, status) => {
    const event = events.find(e => e.id === eventId);
    const requiresReason = event?.isMandatory !== undefined ? event.isMandatory : settings?.absageGrundPflicht;

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

  function handleSubmitReason(eventId) {
    handleUpdateStatus(eventId, pendingStatus, reason);
    setPendingEventId(null);
    setPendingStatus(null);
    setReason('');
  }

  return (
    <aside className="w-full lg:w-[28.5rem] p-8 flex flex-col gap-6 bg-zinc-950/40 border-t lg:border-t-0 border-zinc-900 relative overflow-y-auto no-scrollbar scroll-smooth">
      {/* Header - Tagesansicht */}
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
             <p className="text-[10px] font-bold text-zinc-700 mt-2 uppercase">Genieß den freien Tag!</p>
             
             <button 
              onClick={() => {
                setEventData({
                  title: '',
                  type: 'Training',
                  date: format(selectedDate, 'yyyy-MM-dd'),
                  time: '19:00',
                  location: '',
                  repeat: 'Keine',
                  endDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
                  isMandatory: true,
                  isAutoGoing: true,
                  deadline: 2
                });
                setFormError(null);
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
                        <div className="flex items-center gap-1.5">
                          {event.meetingTime && (
                            <span className="text-[9px] font-black text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Treffen: {event.meetingTime}</span>
                          )}
                          <span className="text-[9px] font-black text-brand bg-brand/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{event.meetingTime ? 'Beginn: ' : ''}{event.time} Uhr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEventData({ 
                          id: event.id, 
                          title: event.title, 
                          type: event.type, 
                          date: format(new Date(event.date), 'yyyy-MM-dd'), 
                          time: event.time || format(new Date(event.date), 'HH:mm'), 
                          meetingTime: event.meetingTime || '',
                          location: event.location, 
                          repeat: 'Keine', 
                          isMandatory: event.isMandatory || false, 
                          isAutoGoing: event.isAutoGoing || false, 
                          deadline: event.deadline || 0 
                        });
                        setActiveModal('event');
                      }}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-600 hover:text-zinc-300 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => setConfirmDelete({ type: 'event', id: event.id, title: event.title })}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-stretch gap-1 p-1 bg-black/20 rounded-[1.25rem] border border-zinc-900/50 h-16">
                  <button onClick={() => handleStatusClick(event.id, 'going')} className={`flex-1 flex flex-col items-center justify-center rounded-xl transition-all border ${myStatus === 'going' ? 'bg-brand/10 border-brand text-brand' : 'border-transparent text-zinc-500 hover:bg-zinc-900/50'}`}>
                    <span className="text-lg font-black leading-none">{goingCount}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest mt-1">Dabei</span>
                  </button>
                  <button onClick={() => handleStatusClick(event.id, 'maybe')} className={`flex-1 flex flex-col items-center justify-center rounded-xl transition-all border ${myStatus === 'maybe' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'border-transparent text-zinc-500 hover:bg-zinc-900/50'}`}>
                    <span className="text-lg font-black leading-none">{maybeCount}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest mt-1">Offen</span>
                  </button>
                  <button onClick={() => handleStatusClick(event.id, 'declined')} className={`flex-1 flex flex-col items-center justify-center rounded-xl transition-all border ${myStatus === 'declined' ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-transparent text-zinc-500 hover:bg-zinc-900/50'}`}>
                    <span className="text-lg font-black leading-none">{declinedCount}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest mt-1">Absagen</span>
                  </button>
                  <button onClick={() => { setExpandedEventId(isExpanded ? null : event.id); setPendingEventId(null); }} className={`w-12 flex items-center justify-center rounded-xl transition-all border ${isExpanded ? 'bg-white text-black' : 'text-zinc-700 hover:bg-zinc-900/50'}`}>
                    {isExpanded ? <X size={16} strokeWidth={3} /> : <Users size={16} />}
                  </button>
                </div>

                {isPending && (
                  <div className={`p-4 border rounded-2xl animate-in slide-in-from-top-2 duration-300 space-y-3 ${
                    pendingStatus === 'maybe' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={12} className={pendingStatus === 'maybe' ? 'text-blue-500' : 'text-red-500'} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        pendingStatus === 'maybe' ? 'text-blue-500/60' : 'text-red-500/60'
                      }`}>
                        {pendingStatus === 'maybe' ? 'Grund für Unsicherheit' : 'Grund der Absage'}
                      </span>
                    </div>
                    <input 
                      autoFocus
                      type="text" 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && reason.trim() && handleSubmitReason(event.id)}
                      placeholder="z.B. Arbeit, Krank..."
                      className={`w-full bg-black/40 border p-3 rounded-xl text-[10px] text-zinc-100 outline-none transition-all ${
                        pendingStatus === 'maybe' ? 'border-blue-500/20 focus:border-blue-500/50' : 'border-red-500/20 focus:border-red-500/50'
                      }`}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => { setPendingEventId(null); setPendingStatus(null); }} className="flex-1 py-2 bg-zinc-900 rounded-lg text-[8px] font-black uppercase text-zinc-500">Abbrechen</button>
                      <button 
                        disabled={!reason.trim()}
                        onClick={() => handleSubmitReason(event.id)} 
                        className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase shadow-lg active:scale-95 disabled:opacity-30 ${
                          pendingStatus === 'maybe' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        Bestätigen
                      </button>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="space-y-1.5 pt-2 animate-in slide-in-from-top-2 duration-300">
                    {sortResponses(responseList).map((res, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <div className="flex items-center gap-3">
                          {res.status === 'going' ? <CheckCircle2 size={10} className="text-brand" /> : res.status === 'declined' ? <XCircle size={10} className="text-red-500" /> : <QuestionIcon size={10} className="text-zinc-600" />}
                          <div>
                            <p className="text-[10px] font-bold text-zinc-300">{res.name}</p>
                            {res.status === 'declined' && res.reason && (
                              <p className="text-[8px] font-medium text-zinc-500 italic mt-0.5">{res.reason}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default EventSidebar;
