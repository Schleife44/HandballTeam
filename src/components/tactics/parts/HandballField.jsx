import React from 'react';

const HandballField = () => {
  return (
    <div className="relative w-full aspect-[40/20] bg-zinc-950 rounded-[2.5rem] border border-zinc-900 overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/10 to-black/60" />
      
      <svg viewBox="0 0 400 200" className="w-full h-full opacity-70">
        {/* Außenlinien */}
        <rect x="10" y="10" width="380" height="180" fill="none" stroke="#27272a" strokeWidth="1" />
        
        {/* Mittellinie & Auswechsellinien (4.5m von Mitte) */}
        <line x1="200" y1="10" x2="200" y2="190" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="155" y1="10" x2="155" y2="20" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="245" y1="10" x2="245" y2="20" stroke="#3f3f46" strokeWidth="1.5" />
        <circle cx="200" cy="100" r="2" fill="#3f3f46" />

        {/* --- LINKE SEITE (Pixelgenau nach Skizze) --- */}
        {/* 6m Torraumlinie: Radius 60, Gerade 30. Start an Grundlinie bei y=25 und y=175 */}
        <path 
          d="M 10 25 
             A 60 60 0 0 1 70 85 
             L 70 115 
             A 60 60 0 0 1 10 175" 
          fill="none" 
          stroke="#84cc16" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        <path 
          d="M 10 25 A 60 60 0 0 1 70 85 L 70 115 A 60 60 0 0 1 10 175 L 10 25" 
          fill="#84cc16" 
          className="opacity-10"
        />

        {/* 9m Freiwurflinie: Radius 90, Gerade 30. Trifft Seitenlinie */}
        <path 
          d="M 60 10 
             A 90 90 0 0 1 100 85 
             L 100 115 
             A 90 90 0 0 1 60 190" 
          fill="none" 
          stroke="#84cc16" 
          strokeWidth="1.5" 
          strokeDasharray="8 6" 
          className="opacity-40" 
        />

        {/* Markierungen links */}
        <line x1="50" y1="97" x2="50" y2="103" stroke="#84cc16" strokeWidth="2.5" /> {/* 4m Torwartgrenze */}
        <line x1="80" y1="97" x2="80" y2="103" stroke="#84cc16" strokeWidth="2.5" /> {/* 7m Linie */}


        {/* --- RECHTE SEITE (Pixelgenau spiegelverkehrt) --- */}
        {/* 6m Torraumlinie */}
        <path 
          d="M 390 25 
             A 60 60 0 0 0 330 85 
             L 330 115 
             A 60 60 0 0 0 390 175" 
          fill="none" 
          stroke="#84cc16" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        <path 
          d="M 390 25 A 60 60 0 0 0 330 85 L 330 115 A 60 60 0 0 0 390 175 L 390 25" 
          fill="#84cc16" 
          className="opacity-10"
        />

        {/* 9m Freiwurflinie */}
        <path 
          d="M 340 10 
             A 90 90 0 0 0 300 85 
             L 300 115 
             A 90 90 0 0 0 340 190" 
          fill="none" 
          stroke="#84cc16" 
          strokeWidth="1.5" 
          strokeDasharray="8 6" 
          className="opacity-40" 
        />

        {/* Markierungen rechts */}
        <line x1="350" y1="97" x2="350" y2="103" stroke="#84cc16" strokeWidth="2.5" />
        <line x1="320" y1="97" x2="320" y2="103" stroke="#84cc16" strokeWidth="2.5" />
        
        {/* Tore (Exakt 3m breit) */}
        <rect x="2" y="85" width="8" height="30" fill="#84cc16" className="opacity-25" />
        <rect x="390" y="85" width="8" height="30" fill="#84cc16" className="opacity-25" />
      </svg>
    </div>
  );
};

export default HandballField;
