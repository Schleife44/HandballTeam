import React from 'react';

const TacticsGhost = ({ player }) => {
  const isBall = player.color === 'ball';
  
  return (
    <div 
      style={{ 
        position: 'absolute',
        left: `${player.x}%`,
        top: `${player.y}%`,
        marginLeft: isBall ? '-12px' : '-20px',
        marginTop: isBall ? '-12px' : '-20px',
      }}
      className={`rounded-full flex items-center justify-center border-2 border-dashed pointer-events-none z-0
        ${player.color === 'attack' ? 'bg-brand/10 border-brand/40 w-10 h-10 shadow-[0_0_10px_rgba(132,204,22,0.1)]' : 
          player.color === 'defense' ? 'bg-zinc-800/30 border-zinc-600/40 w-10 h-10' : 
          'bg-yellow-500/20 border-yellow-300/40 w-6 h-6'}`}
    >
      <span className="text-[10px] font-black italic opacity-40 text-zinc-400">
        {player.number}
      </span>
    </div>
  );
};

export default TacticsGhost;
