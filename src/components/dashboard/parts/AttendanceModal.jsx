import React from 'react';
import { ThumbsUp, HelpCircle, ThumbsDown, MessageSquare } from 'lucide-react';
import Modal from '../../ui/Modal';

const AttendanceModal = ({ isOpen, onClose, event }) => {
  if (!event) return null;
  const responses = event.responses || {};
  const going = Object.entries(responses).filter(([_, r]) => r.status === 'going');
  const maybe = Object.entries(responses).filter(([_, r]) => r.status === 'maybe');
  const declined = Object.entries(responses).filter(([_, r]) => r.status === 'declined' || r.status === 'not-going');

  const Section = ({ title, data, colorClass, icon: Icon }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={colorClass} />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{title}</h3>
        </div>
        <span className={`text-[10px] font-black ${colorClass}`}>{data.length}</span>
      </div>
      <div className="space-y-2">
        {data.length > 0 ? data.map(([name, r], i) => (
          <div key={i} className="flex flex-col gap-1 p-3 rounded-2xl bg-zinc-900/30 border border-zinc-800/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-zinc-100 uppercase italic tracking-tight">{name}</span>
              <span className="text-[7px] font-bold text-zinc-600 uppercase tabular-nums">
                {r.timestamp ? new Date(r.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
            {r.reason && (
              <div className="flex items-center gap-1.5 mt-1 opacity-60">
                <MessageSquare size={8} className="text-zinc-500" />
                <p className="text-[9px] font-medium text-zinc-400 italic">"{r.reason}"</p>
              </div>
            )}
          </div>
        )) : (
          <p className="text-[9px] font-bold text-zinc-700 uppercase italic py-2">Keine Einträge</p>
        )}
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Teilnehmerliste"
      footer={
        <button onClick={onClose} className="w-full py-3 bg-zinc-800 text-zinc-100 text-[10px] font-black uppercase rounded-2xl hover:bg-zinc-700 transition-all">Schließen</button>
      }
    >
      <div className="space-y-8 py-2 max-h-[60vh] overflow-y-auto no-scrollbar">
        <div className="mb-6">
          <h4 className="text-xl font-black text-white uppercase italic leading-none">{event.title}</h4>
          <p className="text-[9px] font-black text-brand uppercase tracking-widest mt-2">
            {event.date} — {event.meetingTime ? `Treffen: ${event.meetingTime} | Beginn: ${event.time}` : event.time}
          </p>
        </div>
        <Section title="Dabei" data={going} colorClass="text-brand" icon={ThumbsUp} />
        <Section title="Vielleicht" data={maybe} colorClass="text-blue-500" icon={HelpCircle} />
        <Section title="Nicht dabei" data={declined} colorClass="text-red-500" icon={ThumbsDown} />
      </div>
    </Modal>
  );
};

export default AttendanceModal;
