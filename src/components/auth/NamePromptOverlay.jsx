import React, { useState } from 'react';
import useStore from '../../store/useStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { User, Hash, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NamePromptOverlay() {
  const { updateActiveMember, activeTeamId, profile, squad } = useStore();
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('select'); // 'select' or 'create'

  const team = profile?.teams?.find(t => t.teamId === activeTeamId);
  const roster = squad?.home || [];

  const handleSelectPlayer = async (player) => {
    setLoading(true);
    await updateActiveMember({
      playerId: player.id,
      playerName: player.name,
      playerNumber: player.number,
    });
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    // updateActiveMember will add the player and we'll get the ID in the next sync
    await updateActiveMember({
      playerName: name.trim(),
      playerNumber: number.trim(),
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6 overflow-y-auto no-scrollbar">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-brand/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="bg-zinc-900/40 border border-zinc-800 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          
          <div className="text-center mb-10 space-y-4">
            <div className="inline-flex p-4 bg-brand/10 rounded-3xl border border-brand/20 mb-2">
              <ShieldCheck size={32} className="text-brand" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-100">Identität wählen</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] leading-relaxed">
                Willkommen bei <span className="text-brand">{team?.teamName || 'deinem Team'}</span>
              </p>
            </div>
            <div className="h-1 w-12 bg-brand mx-auto rounded-full" />
          </div>

          {mode === 'select' && roster.length > 0 ? (
            <div className="space-y-6">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center mb-4">Bist du einer dieser Spieler?</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {roster.map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 bg-black/40 border border-zinc-800 rounded-2xl hover:border-brand/50 hover:bg-brand/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-500 group-hover:bg-brand group-hover:text-black transition-all">
                        {player.number || '?'}
                      </div>
                      <span className="text-sm font-black text-zinc-100 uppercase italic">{player.name}</span>
                    </div>
                    <CheckCircle2 size={18} className="text-zinc-800 group-hover:text-brand transition-colors" />
                  </button>
                ))}
              </div>
              
              <div className="pt-4 border-t border-zinc-800/50">
                <button 
                  onClick={() => setMode('create')}
                  className="w-full py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-brand transition-colors"
                >
                  Ich bin nicht in der Liste
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] px-4">Dein Name</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand transition-colors" />
                    <input 
                      required
                      autoFocus
                      placeholder="Vorname Nachname"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-14 py-4 text-sm font-black text-zinc-100 outline-none focus:border-brand/50 transition-all placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] px-4">Trikot-Nummer (Optional)</label>
                  <div className="relative group">
                    <Hash size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand transition-colors" />
                    <input 
                      type="text"
                      placeholder="z.B. 44"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-14 py-4 text-sm font-black text-zinc-100 outline-none focus:border-brand/50 transition-all placeholder:text-zinc-700"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full py-5 rounded-2xl"
                  disabled={!name.trim() || loading}
                  icon={CheckCircle2}
                >
                  {loading ? 'Wird gespeichert...' : 'Profil erstellen'}
                </Button>

                {roster.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setMode('select')}
                    className="w-full text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors"
                  >
                    Zurück zur Auswahl
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
