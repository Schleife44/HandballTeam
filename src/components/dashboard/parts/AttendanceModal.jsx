import React from 'react';
import { ThumbsUp, HelpCircle, ThumbsDown, MessageSquare, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../ui/Modal';

const AttendanceModal = ({ isOpen, onClose, event }) => {
  if (!event) return null;
  const responses = event.responses || {};
  const going = Object.entries(responses).filter(([_, r]) => r.status === 'going');
  const maybe = Object.entries(responses).filter(([_, r]) => r.status === 'maybe');
  const declined = Object.entries(responses).filter(([_, r]) => r.status === 'declined' || r.status === 'not-going');

  const Section = ({ title, data, colorClass, bgClass, icon: Icon, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-4"
    >
      <div className={`flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r ${bgClass} border border-white/5 shadow-xl`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-black/20 ${colorClass}`}>
            <Icon size={16} strokeWidth={3} />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">{title}</h3>
        </div>
        <div className="px-3 py-1 bg-black/40 rounded-full border border-white/10">
          <span className={`text-[11px] font-black ${colorClass}`}>{data.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 px-1">
        {data.length > 0 ? data.map(([name, r], i) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + (i * 0.05) }}
            key={i} 
            className="group relative flex flex-col gap-2 p-4 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-all hover:bg-zinc-900/60 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-zinc-100 uppercase italic tracking-tight group-hover:text-brand transition-colors">
                {name}
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 rounded-lg border border-white/5">
                <Clock size={10} className="text-zinc-600" />
                <span className="text-[8px] font-black text-zinc-500 uppercase tabular-nums tracking-wider">
                  {r.timestamp ? new Date(r.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>
            </div>
            {r.reason && (
              <div className="flex items-start gap-2.5 p-2 bg-black/20 rounded-xl border border-white/5">
                <MessageSquare size={12} className="text-zinc-600 mt-0.5 shrink-0" />
                <p className="text-[10px] font-bold text-zinc-400 italic leading-relaxed">
                  "{r.reason}"
                </p>
              </div>
            )}
          </motion.div>
        )) : (
          <div className="py-8 text-center border-2 border-dashed border-zinc-800/50 rounded-3xl">
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest italic">Keine Einträge</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Teilnehmerliste"
      footer={
        <button 
          onClick={onClose} 
          className="w-full py-4 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-[2rem] hover:bg-zinc-800 transition-all active:scale-95 shadow-2xl"
        >
          Fenster schließen
        </button>
      }
    >
      <div className="space-y-10 py-4">
        <div className="relative p-6 rounded-[2.5rem] bg-gradient-to-br from-brand/20 via-zinc-900/50 to-zinc-900 border border-brand/20 overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand/10 blur-3xl rounded-full group-hover:bg-brand/20 transition-all duration-700" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
              <span className="text-[9px] font-black text-brand uppercase tracking-[0.3em]">Event Details</span>
            </div>
            
            <h4 className="text-2xl lg:text-3xl font-black text-white uppercase italic leading-none tracking-tighter drop-shadow-xl">
              {event.title}
            </h4>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/5">
                <Calendar size={12} className="text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{event.date}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/5">
                <Clock size={12} className="text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                  {event.meetingTime ? `Treffen: ${event.meetingTime} | Start: ${event.time}` : `${event.time} Uhr`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-12 pb-10">
          <Section 
            title="Dabei" 
            data={going} 
            colorClass="text-brand" 
            bgClass="from-brand/20 to-zinc-900"
            icon={ThumbsUp} 
            delay={0.1}
          />

          {/* Render Maybe here if it HAS data */}
          {maybe.length > 0 && (
            <Section 
              title="Vielleicht" 
              data={maybe} 
              colorClass="text-blue-500" 
              bgClass="from-blue-500/20 to-zinc-900"
              icon={HelpCircle} 
              delay={0.2}
            />
          )}

          <Section 
            title="Nicht dabei" 
            data={declined} 
            colorClass="text-red-500" 
            bgClass="from-red-500/20 to-zinc-900"
            icon={ThumbsDown} 
            delay={0.3}
          />

          {/* Render Maybe here if it is EMPTY */}
          {maybe.length === 0 && (
            <Section 
              title="Vielleicht" 
              data={maybe} 
              colorClass="text-blue-500" 
              bgClass="from-blue-500/20 to-zinc-900"
              icon={HelpCircle} 
              delay={0.4}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AttendanceModal;
