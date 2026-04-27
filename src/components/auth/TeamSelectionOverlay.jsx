import React, { useState } from 'react';
import { Plus, Users, ArrowRight, Loader2, Trophy } from 'lucide-react';
import useStore from '../../store/useStore';

export default function TeamSelectionOverlay() {
  const { profile, createTeam, setActiveTeam, logout } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#84cc16');
  const [playerName, setPlayerName] = useState('');
  const [hnetUrl, setHnetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const colors = ['#84cc16', '#dc3545', '#2563eb', '#f59e0b', '#7c3aed', '#ec4899', '#3f3f46', '#ffffff'];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || !playerName.trim()) return;
    
    setLoading(true);
    await createTeam({
      teamName: newTeamName.trim(),
      teamColor,
      playerName: playerName.trim(),
      hnetUrl: hnetUrl.trim()
    });
    setLoading(false);
  };

  const teams = profile?.teams || [];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 overflow-y-auto">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-xl relative z-10 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-bold uppercase tracking-widest mb-6">
            <Trophy size={12} />
            <span>Setup abschließen</span>
          </div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Willkommen bei <span className="text-brand">Sechsmeter</span>
          </h2>
          <p className="text-zinc-500 mt-2">Lass uns dein Team in 30 Sekunden startklar machen.</p>
        </div>

        {!showCreate ? (
          <div className="space-y-4">
            {teams.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {teams.map((team) => (
                  <button
                    key={team.teamId}
                    onClick={() => setActiveTeam(team.teamId)}
                    className="group bg-zinc-950 border border-zinc-900 hover:border-brand/50 p-6 rounded-2xl flex items-center justify-between transition-all hover:bg-zinc-900"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                        <Users size={24} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-white group-hover:text-brand transition-colors">{team.teamName}</h3>
                        <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">{team.role === 'trainer' ? 'Trainer / Owner' : 'Mitglied'}</p>
                      </div>
                    </div>
                    <ArrowRight className="text-zinc-700 group-hover:text-brand group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowCreate(true)}
              className="w-full border-2 border-dashed border-zinc-800 hover:border-brand/50 hover:bg-brand/5 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 text-zinc-500 hover:text-brand transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                <Plus size={24} />
              </div>
              <div className="text-center">
                <span className="block font-black uppercase italic text-lg text-zinc-100 group-hover:text-brand">Neues Team anlegen</span>
                <span className="text-xs font-bold opacity-60">Erstelle dein eigenes Projekt</span>
              </div>
            </button>
            
            <button 
              onClick={logout}
              className="w-full text-zinc-700 hover:text-white text-xs font-bold uppercase tracking-widest mt-8 transition-colors"
            >
              Abmelden
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="bg-zinc-950 border border-zinc-900 p-8 rounded-3xl shadow-2xl space-y-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-2">
                <Plus className="text-brand" />
                Team Konfigurieren
              </h3>
              <button type="button" onClick={() => setShowCreate(false)} className="text-[10px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest">Abbrechen</button>
            </div>
            
            <div className="space-y-6">
              {/* Team Name */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Name des Teams</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="z.B. Mein Team / Verein"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-black border border-zinc-900 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand transition-all font-bold"
                  required
                />
              </div>

              {/* Team Color */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Vereinsfarbe</label>
                <div className="flex flex-wrap gap-3 px-2">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTeamColor(c)}
                      className={`w-10 h-10 rounded-xl transition-all ${teamColor === c ? 'scale-125 ring-2 ring-white ring-offset-4 ring-offset-black' : 'opacity-40 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Player Name */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Dein Name (für Kader & Statistik)</label>
                <input
                  type="text"
                  placeholder="Vorname Nachname"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-black border border-zinc-900 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand transition-all font-bold"
                  required
                />
              </div>

              {/* Handball.net Link */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 flex justify-between">
                  <span>Handball.net Link</span>
                  <span className="text-[8px] opacity-40">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="https://www.handball.net/mannschaften/..."
                  value={hnetUrl}
                  onChange={(e) => setHnetUrl(e.target.value)}
                  className="w-full bg-black border border-zinc-900 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand transition-all text-sm font-medium"
                />
                <p className="text-[8px] font-bold text-zinc-600 uppercase px-2 leading-relaxed italic">
                  Für automatischen Spielplan-Import (kann später in den Einstellungen ergänzt werden).
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !newTeamName.trim() || !playerName.trim()}
                className="w-full bg-brand hover:bg-brand-bright text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl shadow-brand/20 mt-4 group"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Plus size={20} className="group-hover:rotate-90 transition-transform" />}
                <span className="uppercase italic tracking-tighter text-lg">Setup abschließen & Starten</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
