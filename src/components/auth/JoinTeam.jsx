import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Users, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import useStore from '../../store/useStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function JoinTeam() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, joinTeam, setActiveTeam } = useStore();

  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const teamRef = doc(db, 'teams', teamId);
        const snap = await getDoc(teamRef);
        if (snap.exists()) {
          setTeamInfo(snap.data());
        } else {
          setError('Team nicht gefunden. Der Link ist eventuell ungültig.');
        }
      } catch (e) {
        setError('Fehler beim Laden des Teams.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [teamId]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || joining) return;

    setJoining(true);
    const result = await joinTeam(teamId, {
      name: playerName.trim(),
      number: playerNumber.trim() || '?'
    });

    if (result.success) {
      setActiveTeam(teamId);
      navigate('/dashboard');
    } else {
      setError(result.error);
      setJoining(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8">
          <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center text-brand mx-auto mb-8">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Login erforderlich</h2>
          <p className="text-zinc-500">Bitte melde dich zuerst an oder erstelle ein Konto, um einem Team beizutreten.</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-brand text-black font-black py-4 rounded-2xl uppercase italic tracking-tighter"
          >
            Zum Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-brand animate-spin" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <h2 className="text-2xl font-black text-red-500 uppercase italic">{error}</h2>
          <button onClick={() => navigate('/')} className="text-brand font-bold uppercase tracking-widest text-xs">Zurück zur Startseite</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-xl py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-bold uppercase tracking-widest mb-6">
            <Users size={12} />
            <span>Einladung erhalten</span>
          </div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Tritt dem Team <span className="text-brand">{teamInfo?.name}</span> bei
          </h2>
          <p className="text-zinc-500 mt-2 text-sm">Vervollständige dein Profil, um loszulegen.</p>
        </div>

        <form onSubmit={handleJoin} className="bg-zinc-950 border border-zinc-900 p-8 rounded-3xl shadow-2xl space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Dein Name</label>
              <input
                autoFocus
                type="text"
                placeholder="z.B. Max Mustermann"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-black border border-zinc-900 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand transition-all font-bold"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Deine Nummer (Optional)</label>
              <input
                type="text"
                placeholder="z.B. 7"
                value={playerNumber}
                onChange={(e) => setPlayerNumber(e.target.value)}
                className="w-full bg-black border border-zinc-900 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-brand transition-all font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={joining || !playerName.trim()}
              className="w-full bg-brand hover:bg-brand-bright text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl shadow-brand/20 mt-4 group"
            >
              {joining ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              <span className="uppercase italic tracking-tighter text-lg">Team beitreten</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
