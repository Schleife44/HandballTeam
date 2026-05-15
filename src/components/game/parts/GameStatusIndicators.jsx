import React from 'react';
import { Target, UserPlus } from 'lucide-react';

const GameStatusIndicators = ({ activeMatch, toggleEmptyGoal, gameLogic }) => {
  return (
    <div className="hidden lg:flex items-center justify-between mb-8">
      {activeMatch.mode === 'COMPLEX' && (
        <div className="flex items-center gap-3">
          <div 
            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-all ${activeMatch.isEmptyGoal ? 'bg-red-500' : 'bg-zinc-800'}`} 
            onClick={() => toggleEmptyGoal()}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-all ${activeMatch.isEmptyGoal ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-[10px] font-black uppercase text-zinc-100 tracking-wider">Leeres Tor</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        {gameLogic.sevenMeterFlow?.step === 'shooter' && (
          <div className="flex items-center gap-3 px-4 py-2 bg-brand/20 border border-brand/40 rounded-2xl animate-pulse">
            <Target size={14} className="text-brand" />
            <span className="text-[10px] font-black text-brand uppercase tracking-widest">7m Schützen wählen...</span>
          </div>
        )}
        {gameLogic.swapPending && (
          <div className="flex items-center gap-3 px-4 py-2 bg-brand/10 border border-brand/20 rounded-2xl animate-pulse">
            <UserPlus size={14} className="text-brand" />
            <span className="text-[10px] font-black text-brand uppercase tracking-widest">#{gameLogic.swapPending.number} einwechseln...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStatusIndicators;
