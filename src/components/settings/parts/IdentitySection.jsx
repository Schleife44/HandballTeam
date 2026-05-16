import { User, X as CloseIcon } from 'lucide-react';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

export const TeamConfig = ({ label, name, season, color, colors, onUpdateName, onUpdateSeason, onUpdateColor, isTrainer }) => {
  return (
    <div className="space-y-8 w-full overflow-hidden">
      <div className="flex-1 w-full min-w-0 space-y-6">
        <div className="w-full">
          <Input 
            label={label}
            value={name}
            onChange={(e) => onUpdateName(e.target.value)}
            disabled={!isTrainer}
            className="w-full"
          />
        </div>

        <div className="space-y-4 w-full overflow-hidden">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-4 block">Team Farbe</label>
          <div className="flex flex-nowrap gap-3 px-2 overflow-x-auto no-scrollbar pb-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => isTrainer && onUpdateColor(c)}
                disabled={!isTrainer}
                className={`w-8 h-8 flex-shrink-0 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'} ${isTrainer ? 'hover:scale-110 cursor-pointer' : 'cursor-default opacity-50'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PlayerProfile = ({ players, selectedPlayer, onUpdate }) => (
  <div className="space-y-2 border-t border-zinc-800/50 pt-6">
    <Select 
      label="Dein Spieler-Profil"
      value={selectedPlayer || ''}
      onChange={(e) => onUpdate(e.target.value)}
    >
      <option value="">Wähle dich aus...</option>
      {players.map(p => (
        <option key={p.id} value={p.name}>{p.name} (#{p.number})</option>
      ))}
    </Select>
    <p className="text-[8px] font-bold text-zinc-600 uppercase px-4 mt-1">Verknüpft dich mit einem Spieler im Kader für eigene Zusagen.</p>
  </div>
);
