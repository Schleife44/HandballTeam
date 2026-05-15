import React from 'react';
import { Activity } from 'lucide-react';

const DashboardHeader = ({ teamName }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
          <Activity size={20} />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase italic text-white leading-none">
            Sechs<span className="text-brand">meter</span>
          </h1>
          <p className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.4em] mt-1 italic">
            {teamName || 'Loading...'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
         <div className="text-right hidden sm:block">
            <div className="text-lg font-black text-white tracking-tighter tabular-nums italic leading-none">
              {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}
            </div>
            <div className="text-[9px] font-black uppercase text-brand tracking-[0.2em] mt-1">
              {new Date().toLocaleDateString('de-DE', { weekday: 'long' })}
            </div>
         </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
