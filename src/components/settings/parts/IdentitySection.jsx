import React from 'react';
import { User } from 'lucide-react';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

export const TeamConfig = ({ label, name, season, color, colors, onUpdateName, onUpdateSeason, onUpdateColor }) => (
  <div className="space-y-6">
    <Input 
      label={label}
      value={name}
      onChange={(e) => onUpdateName(e.target.value)}
    />

    {label.includes('Dein Teamname') && (
      <Input 
        label="Aktuelle Saison"
        value={season || '25/26'}
        placeholder="z.B. 25/26"
        onChange={(e) => onUpdateSeason?.(e.target.value)}
      />
    )}

    <div className="space-y-4">
      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-4 block">Team Farbe</label>
      <div className="flex flex-nowrap gap-3 px-2 overflow-x-auto no-scrollbar">
        {colors.map(c => (
          <button
            key={c}
            onClick={() => onUpdateColor(c)}
            className={`w-10 h-10 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-110'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  </div>
);

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
