import React from 'react';

const DayLabels = () => (
  <div className="grid grid-cols-7 border-b border-zinc-900 bg-zinc-900/10">
    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
      <div key={i} className="py-4 text-center text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">{day}</div>
    ))}
  </div>
);

export default DayLabels;
