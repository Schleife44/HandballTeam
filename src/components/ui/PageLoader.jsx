import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
      <div className="relative">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-brand/20 blur-3xl rounded-full animate-pulse" />
        
        {/* Main Loader */}
        <div className="relative flex items-center justify-center">
          <Loader2 className="text-brand animate-spin" size={48} strokeWidth={1.5} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-brand rounded-full animate-ping" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-sm font-black text-zinc-100 uppercase italic tracking-tighter">
          Daten werden geladen
        </h3>
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] animate-pulse">
          Sechsmeter Hub v2.1
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
