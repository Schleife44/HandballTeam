import React from 'react';
import { Calendar } from 'lucide-react';
import EventRow from '../parts/EventRow';

const SectionHeader = ({ title, icon: Icon, badge }) => (
  <div className="flex items-center justify-between mb-4 px-2">
    <div className="flex items-center gap-3">
      <div className="w-1 h-6 bg-brand rounded-full shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
      <h3 className="text-xs font-black uppercase italic tracking-widest text-zinc-400 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-brand/60" />}
        {title}
      </h3>
    </div>
    {badge && <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic">{badge}</span>}
  </div>
);

const UpcomingEvents = ({ events, onRsvp, onDetails, settings }) => {
  return (
    <section className="space-y-4">
      <SectionHeader title="Termine" icon={Calendar} />
      <div className="space-y-2">
        {Array.isArray(events) && events.length > 0 ? (
          events.slice(0, 3).map(e => (
            <EventRow 
              key={e.id} 
              {...e} 
              onRsvp={onRsvp} 
              onDetails={onDetails} 
              settings={settings || {}} 
            />
          ))
        ) : (
          <div className="p-8 rounded-3xl bg-zinc-950/40 border border-white/5 text-center">
            <p className="text-[9px] font-black uppercase text-zinc-700 tracking-widest italic">Keine Termine</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingEvents;
