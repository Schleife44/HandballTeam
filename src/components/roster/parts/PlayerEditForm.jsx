import React from 'react';
import { positions } from '../../../utils/playerUtils';

const PlayerEditForm = ({ editData, onEditChange }) => {
  return (
    <div className="space-y-4">
      <input 
        type="text"
        value={editData.name}
        onChange={(e) => onEditChange({ ...editData, name: e.target.value })}
        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white font-black italic uppercase tracking-tighter outline-none focus:border-brand/40"
        placeholder="Name..."
      />
      
      <div className="space-y-2">
        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Haupt-Position</p>
        <div className="flex flex-wrap gap-1">
          {positions.map(pos => (
            <button
              key={`p1-${pos}`}
              onClick={() => onEditChange({ ...editData, position: pos, isGoalkeeper: pos === 'TW' })}
              className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all
                ${editData.position === pos ? 'bg-brand/20 border-brand text-brand' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Neben-Position</p>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onEditChange({ ...editData, position2: '' })}
            className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all
              ${!editData.position2 ? 'bg-zinc-700 border-white/20 text-white' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
          >
            X
          </button>
          {positions.filter(p => p !== editData.position).map(pos => (
            <button
              key={`p2-${pos}`}
              onClick={() => onEditChange({ ...editData, position2: pos })}
              className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all
                ${editData.position2 === pos ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerEditForm;
