import React from 'react';
import { Calendar, Trash2, Video, BarChart2, ChevronRight, Globe, Activity, CheckCircle2 } from 'lucide-react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import useStore from '../../../store/useStore';

const GameCard = ({ game, onSelect, onDelete }) => {
  const { activeMember, squad } = useStore();
  const isOwner = activeMember?.uid === squad?.ownerUid;
  const isTrainer = activeMember?.role === 'trainer' || activeMember?.role === 'admin' || isOwner;

  const d = new Date(game.timestamp || game.date || game.id);
  const formattedDate = isNaN(d.getTime()) ? 'Unbekannt' : d.toLocaleDateString('de-DE');

  // Standardized Naming with Fallbacks
  const teamHome = game.teamHome || game.settings?.teamNameHeim || game.teams?.heim || 'Heim';
  const teamAway = game.teamAway || game.settings?.teamNameGegner || game.teams?.gegner || 'Gast';
  const scoreHome = game.scoreHome ?? game.score?.heim ?? game.score?.home ?? 0;
  const scoreAway = game.scoreAway ?? game.score?.gegner ?? game.score?.away ?? 0;

  return (
    <Card 
      className="p-5 group cursor-pointer hover:border-brand/30 transition-all"
      onClick={() => onSelect(game, 'game_stats')}
    >
      <div className="flex flex-col gap-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            <Calendar size={12} />
            {formattedDate}
            <div className="h-3 w-[1px] bg-zinc-800 mx-1" />
            {(game.isSynced && game.syncReport) ? (
              <Badge variant="brand" className="text-[8px] py-0.5">
                <CheckCircle2 size={10} className="mr-1" /> Abgeglichen
              </Badge>
            ) : (game.hnetGameId || game.isSynced) ? (
              <Badge variant="outline" className="text-[8px] py-0.5 text-blue-400 border-blue-400/20">
                <Globe size={10} className="mr-1" /> Handball.net
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[8px] py-0.5 text-orange-400 border-orange-400/20">
                <Activity size={10} className="mr-1" /> Manuell
              </Badge>
            )}
          </div>
          {isTrainer && (
            <Button 
              variant="ghost" 
              size="icon" 
              icon={Trash2} 
              onClick={(e) => { 
                e.stopPropagation(); 
                onDelete(game.id || game.timestamp || game.date); 
              }}
              className="text-zinc-600 hover:text-red-500"
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-200">{teamHome}</span>
            <span className="text-lg font-black text-brand italic">{scoreHome}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-200">{teamAway}</span>
            <span className="text-lg font-black text-brand italic">{scoreAway}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50 mt-2">
          <Button 
            variant="ghost"
            size="sm"
            icon={Video}
            onClick={(e) => { e.stopPropagation(); onSelect(game, 'video'); }}
            className="text-[9px] py-1 h-auto"
          >
            Video
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            icon={BarChart2}
            onClick={(e) => { e.stopPropagation(); onSelect(game, 'game_stats'); }}
            className="text-[9px] py-1 h-auto"
          >
            Stats
          </Button>
          <div className="flex-1" />
          <ChevronRight size={16} className="text-zinc-700 group-hover:text-brand group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Card>
  );
};

export default GameCard;
