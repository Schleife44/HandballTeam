import React from 'react';
import { ThumbsUp, HelpCircle, ThumbsDown, ChevronRight, X } from 'lucide-react';

const RSVPButton = ({ icon: Icon, active, count, color, onClick, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all active:scale-95
    ${active 
      ? (color === 'green' ? 'bg-brand text-black border-brand shadow-lg shadow-brand/20' : color === 'red' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-500 text-white border-blue-500')
      : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
    }
    ${disabled ? 'opacity-45 cursor-not-allowed grayscale-[0.4]' : ''}`}
  >
    <Icon size={14} strokeWidth={active ? 3 : 2} />
    <span className="text-[11px] font-black">{count}</span>
  </button>
);

const EventRow = ({ type, title, date, time, meetingTime, attendees, myStatus, onRsvp, settings, id, onDetails, isMandatory, deadlineDate, isCancelled }) => {
  const [isPending, setIsPending] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    if (!deadlineDate) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const deadline = new Date(deadlineDate);
      const diff = deadline - now;
      
      if (diff <= 0) {
        setTimeLeft('expired');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (h < 24) {
        setTimeLeft(`${h}h ${m}m`);
      } else {
        setTimeLeft('');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [deadlineDate]);

  const handleRsvp = (status) => {
    // Priority: Event-specific 'isMandatory', fallback to global settings
    const requiresReason = isMandatory !== undefined ? isMandatory : settings?.absageGrundPflicht;
    
    if (status !== 'going' && requiresReason === true) {
      setIsPending(status);
    } else {
      onRsvp(id, status);
    }
  };

  const isExpired = deadlineDate && new Date() > new Date(deadlineDate);
  const isUrgent = deadlineDate && !isExpired && (new Date(deadlineDate) - new Date() < 24 * 60 * 60 * 1000);

  return (
    <div className="relative pl-8 lg:pl-10 pb-12 last:pb-0 border-l-2 border-zinc-800/50 group">
      <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-4 border-black group-hover:scale-125 transition-transform ${
        isCancelled ? 'bg-zinc-800 shadow-none' :
        type === 'SPIEL' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 
        type === 'TRAINING' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' :
        'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
      }`} />
      
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{date}</span>
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
              {meetingTime && (
                <>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Treffen: {meetingTime}</span>
                  <div className="w-1 h-1 rounded-full bg-zinc-800" />
                </>
              )}
              <span className={`text-[10px] font-black uppercase tracking-widest ${isCancelled ? 'text-zinc-600' : 'text-brand'}`}>
                {meetingTime ? 'Beginn: ' : ''}{time}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-3">
              <h4 className={`text-lg lg:text-xl font-black uppercase italic tracking-tight leading-none ${isCancelled ? 'text-zinc-600 line-through' : 'text-zinc-100'}`}>
                {title}
              </h4>
              {isCancelled && (
                <span className="px-2 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg animate-pulse">Entfällt</span>
              )}
            </div>
            <span className={`inline-block px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
              isCancelled ? 'bg-zinc-800/50 border-zinc-800 text-zinc-600' :
              type === 'SPIEL' ? 'bg-red-500/10 border-red-500/10 text-red-500' : 
              type === 'TRAINING' ? 'bg-blue-500/10 border-blue-500/10 text-blue-500' : 
              'bg-amber-500/10 border-amber-500/10 text-amber-400'
            }`}>{type}</span>
          </div>
          <button 
            onClick={() => onDetails(id)}
            className="p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-600 hover:text-brand hover:border-brand/30 transition-all shadow-xl active:scale-95 shrink-0"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="relative min-h-[44px]">
          {isPending ? (
            <div className="absolute inset-0 z-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <input 
                autoFocus
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Grund..."
                className="flex-1 bg-black/40 border border-zinc-800 rounded-xl py-1.5 px-3 text-[10px] font-bold text-zinc-100 outline-none focus:border-brand/50 transition-all"
              />
              <div className="flex gap-1">
                <button onClick={() => { onRsvp(id, isPending, reason); setIsPending(false); }} className="w-8 h-8 flex items-center justify-center bg-brand text-black rounded-xl hover:scale-105 transition-transform"><ThumbsUp size={14} /></button>
                <button onClick={() => setIsPending(false)} className="w-8 h-8 flex items-center justify-center bg-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-700 transition-colors"><X size={14} /></button>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col gap-2 ${isCancelled ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
              <div className="flex gap-1.5 lg:gap-2.5 overflow-x-auto no-scrollbar">
                <RSVPButton 
                  icon={ThumbsUp} 
                  count={attendees?.going || 0} 
                  color="green" 
                  active={myStatus === 'going'} 
                  disabled={isExpired}
                  onClick={() => handleRsvp('going')} 
                />
                <RSVPButton 
                  icon={HelpCircle} 
                  count={attendees?.maybe || 0} 
                  color="blue" 
                  active={myStatus === 'maybe'} 
                  disabled={isExpired}
                  onClick={() => handleRsvp('maybe')} 
                />
                <RSVPButton 
                  icon={ThumbsDown} 
                  count={attendees?.declined || 0} 
                  color="red" 
                  active={myStatus === 'declined'} 
                  disabled={isExpired}
                  onClick={() => handleRsvp('declined')} 
                />
              </div>
              
              {deadlineDate && (
                <div className="flex items-center gap-2 ml-1">
                  <div className={`w-1 h-1 rounded-full ${isExpired || isUrgent ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-zinc-600'}`} />
                  <div className="flex flex-col">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isExpired || isUrgent ? 'text-red-500' : 'text-zinc-600'}`}>
                      {isExpired 
                        ? 'Frist abgelaufen' 
                        : isUrgent
                          ? `Noch ${timeLeft} zum Abmelden!` 
                          : `Abmelden möglich bis`}
                    </span>
                    {!isExpired && (
                      <span className={`text-[7px] font-bold uppercase tracking-tight ${isUrgent ? 'text-red-400/60' : 'text-zinc-700'}`}>
                        {new Date(deadlineDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr am {new Date(deadlineDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventRow;
