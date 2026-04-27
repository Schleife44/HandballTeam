import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Target, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Download
} from 'lucide-react';

const ProtocolTab = ({ match }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLog = match.log.filter(entry => {
    const searchString = `${entry.playerName} ${entry.type} ${entry.details?.fieldPos || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getIcon = (type) => {
    switch (type) {
      case 'GOAL': return <Target className="text-brand" size={16} />;
      case 'TWO_MIN': return <Clock className="text-orange-500" size={16} />;
      case 'YELLOW': return <AlertCircle className="text-yellow-500" size={16} />;
      default: return <TrendingUp className="text-zinc-500" size={16} />;
    }
  };

  const getActionLabel = (type) => {
    switch (type) {
      case 'GOAL': return 'Tor';
      case 'MISS': return 'Fehlwurf';
      case 'SAVE': return 'Parade (TW)';
      case 'TWO_MIN': return '2 Minuten';
      case 'YELLOW': return 'Gelb';
      case 'RED': return 'Rot';
      case 'BLOCKED': return 'Block';
      default: return type;
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] backdrop-blur-md overflow-hidden">
      {/* Search Header */}
      <div className="p-8 border-b border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input 
              type="text" 
              placeholder="Protokoll durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-zinc-100 focus:border-brand outline-none transition-all"
            />
          </div>
        </div>
        
        <button className="flex items-center gap-3 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all">
          <Download size={16} />
          Export Protokoll
        </button>
      </div>

      {/* Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Zeit</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Spieler</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Aktion</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Details</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Stand</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {filteredLog.length > 0 ? filteredLog.map((entry, idx) => (
              <tr key={idx} className="group hover:bg-zinc-100/5 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <Clock size={12} className="text-zinc-700" />
                    <span className="text-xs font-black text-zinc-400 tabular-nums">{entry.time}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${entry.team === 'home' ? 'bg-brand/10 text-brand' : 'bg-zinc-800 text-zinc-500'}`}>
                      {entry.playerNumber}
                    </div>
                    <span className="text-xs font-bold text-zinc-200">{entry.playerName}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    {getIcon(entry.type)}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${entry.type === 'GOAL' ? 'text-brand' : 'text-zinc-300'}`}>
                      {getActionLabel(entry.type)}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {entry.details?.fieldPos ? `${entry.details.fieldPos} ${entry.details.goalPos ? '➔ Tor ' + entry.details.goalPos : ''}` : '-'}
                </td>
                <td className="px-8 py-6 text-right">
                  <span className="text-xs font-black italic text-zinc-400">{entry.score}</span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  Keine Einträge gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProtocolTab;
