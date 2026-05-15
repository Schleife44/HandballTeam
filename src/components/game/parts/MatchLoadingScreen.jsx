import React from 'react';
import { Zap } from 'lucide-react';

const MatchLoadingScreen = () => {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
        <Zap size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand animate-pulse" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Bereite Spiel vor</h2>
      </div>
    </div>
  );
};

export default MatchLoadingScreen;
