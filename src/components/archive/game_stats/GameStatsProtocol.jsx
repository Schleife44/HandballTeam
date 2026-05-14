import React from 'react';
import { Clock, CheckCircle2, Activity } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';

const GameStatsProtocol = ({ currentGame, getSecs, handleManualFix }) => {
  if (!currentGame) return null;

  return (
    <Card noPadding title="Spielprotokoll (Aktionen)" icon={Clock} className="shadow-2xl overflow-hidden animate-in fade-in duration-500">
      <div className="max-h-[600px] overflow-y-auto">
        <div className="flex flex-col">
          {[...(currentGame.gameLog || currentGame.log || [])]
            .sort((a, b) => {
              const sA = getSecs(a.time);
              const hA = a.half || (sA > 1800 ? 2 : 1);
              const sB = getSecs(b.time);
              const hB = b.half || (sB > 1800 ? 2 : 1);
              const normA = sA > 1800 ? sA - 1800 : sA;
              const normB = sB > 1800 ? sB - 1800 : sB;
              const absA = (hA - 1) * 1800 + normA;
              const absB = (hB - 1) * 1800 + normB;
              return absA - absB;
            })
            .map((entry, idx) => {
              const isGegner = entry.action?.startsWith('Gegner');
              return (
                <div key={idx} className={`flex items-center gap-6 px-8 py-4 border-b border-zinc-800/50 hover:bg-white/5 transition-all ${isGegner ? 'opacity-60 bg-red-500/5' : ''} ${entry.isOfficialOnly ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''}`}>
                  <div className="w-16 text-[10px] font-mono text-brand font-bold">{entry.time || '--:--'}</div>
                  <div className="flex items-center gap-3 w-14">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black overflow-hidden px-1 ${isGegner ? 'bg-zinc-800 text-zinc-500' : 'bg-brand/10 text-brand'}`}>
                      <span className="truncate">{entry.playerNumber ?? entry.gegnerNummer ?? entry.number ?? entry.playerId ?? '--'}</span>
                    </div>
                    {entry.isSynced ? (
                      <div className="flex flex-col gap-0.5">
                        <CheckCircle2 size={10} className="text-green-500" />
                        {entry.isOfficialOnly && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleManualFix(entry); }}
                            className="px-1.5 py-0.5 bg-blue-500 text-white text-[6px] font-black rounded hover:scale-110 transition-all mt-1 cursor-pointer"
                          >
                            LINK
                          </button>
                        )}
                      </div>
                    ) : (
                      ["Tor", "2 Minuten", "Gelbe Karte", "Rote Karte"].some(a => entry.action.includes(a)) && (
                        <div className="flex flex-col items-center gap-1 group/fix">
                          <Activity size={10} className="text-red-500 animate-pulse" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleManualFix(entry); }}
                            className="px-1.5 py-0.5 bg-red-500 text-white text-[6px] font-black rounded border border-red-500/20 opacity-0 group-hover/fix:opacity-100 transition-all cursor-pointer hover:scale-110"
                          >
                            FIX
                          </button>
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                      {entry.action}
                      {entry.isOfficialOnly && <Badge variant="outline" className="text-[7px] py-0.5 text-blue-400 border-blue-400/20">Official</Badge>}
                      {!entry.isSynced && ["Tor", "2 Minuten", "Gelbe Karte", "Rote Karte"].some(a => entry.action.includes(a)) && (
                        <span className="text-[7px] text-red-500/50 font-black italic ml-auto uppercase tracking-widest">Nicht abgeglichen</span>
                      )}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500">{entry.playerName || (isGegner ? 'Gegner' : 'Unbekannter Spieler')}</p>
                  </div>
                  <div className="text-[10px] font-black text-zinc-600 italic">
                    {entry.score || entry.spielstand || ''}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </Card>
  );
};

export default GameStatsProtocol;
