import React from 'react';
import { 
  Building2, 
  ChevronRight,
  Plus,
  Users,
  Trophy,
  Activity
} from 'lucide-react';
import useStore from '../../store/useStore';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { db } from '../../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Sub-component for individual team cards to fetch their own stats
const ClubTeamCard = ({ team, onSelect }) => {
  const [stats, setStats] = React.useState({
    memberCount: 0,
    gameCount: 0,
    totalGoals: 0,
    winRate: '0%',
    loading: true
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Members count
        const membersSnap = await getDocs(collection(db, 'teams', team.id, 'members'));
        
        // 2. Fetch from both HISTORY and EVENTS (for games not yet archived)
        const historyRef = collection(db, 'teams', team.id, 'history');
        const eventsRef = collection(db, 'teams', team.id, 'events');
        
        const [historySnap, eventsSnap] = await Promise.all([
          getDocs(historyRef),
          getDocs(eventsRef)
        ]);

        const historyGames = historySnap.docs
          .map(d => d.data())
          .filter(g => new Date(g.date) < new Date());

        const pastEventGames = eventsSnap.docs
          .map(d => d.data())
          .filter(e => (e.type?.toUpperCase() === 'SPIEL' || e.type === 'game') && e.score && new Date(e.date) < new Date());

        // Merge all unique games
        const allGames = [...historyGames];
        pastEventGames.forEach(eg => {
          if (!allGames.some(hg => hg.hnetGameId && eg.hnetGameId && String(hg.hnetGameId) === String(eg.hnetGameId))) {
            allGames.push(eg);
          }
        });
        
        let goals = 0;
        let wins = 0;
        
        allGames.forEach(game => {
          let isHome = true;
          // Robust ID Resolution: Check settings, top-level, or extract from URL (Legacy Style)
          let hnetId = team.settings?.teamId || team.teamId;
          if (!hnetId && team.settings?.hnetUrl) {
            const fullId = team.settings.hnetUrl.trim().replace(/\/$/, '');
            hnetId = (fullId.match(/(\d+)$/) || [])[1] || fullId.split('/').pop();
          }
          
          const myTeamName = (team.settings?.homeName || team.name || "").toLowerCase().trim();
          const hName = (game.teamHome || game.teams?.heim || "").toLowerCase().trim();
          const aName = (game.teamAway || game.teams?.gegner || "").toLowerCase().trim();

          if (game.hnetGameId && game.homeTeamId && hnetId && String(game.homeTeamId) === String(hnetId)) {
            isHome = true;
          } else if (game.hnetGameId && game.awayTeamId && hnetId && String(game.awayTeamId) === String(hnetId)) {
            isHome = false;
          } else if (myTeamName && hName && (hName.includes(myTeamName) || myTeamName.includes(hName))) {
            isHome = true;
          } else if (myTeamName && aName && (aName.includes(myTeamName) || myTeamName.includes(aName))) {
            isHome = false;
          } else if (game.settings?.isAuswaertsspiel !== undefined) {
            isHome = !game.settings.isAuswaertsspiel;
          } else if (game.isAuswaerts !== undefined) {
            isHome = !game.isAuswaerts;
          }

          const myScore = isHome 
            ? (game.scoreHome ?? game.score?.home ?? game.score?.heim ?? 0) 
            : (game.scoreAway ?? game.score?.away ?? game.score?.gegner ?? 0);
          const oppScore = isHome 
            ? (game.scoreAway ?? game.score?.away ?? game.score?.gegner ?? 0) 
            : (game.scoreHome ?? game.score?.home ?? game.score?.heim ?? 0);

          goals += Number(myScore);
          if (Number(myScore) > Number(oppScore)) wins++;
        });

        setStats({
          memberCount: membersSnap.size,
          gameCount: allGames.length,
          totalGoals: goals,
          winRate: allGames.length ? Math.round((wins / allGames.length) * 100) + '%' : '0%',
          loading: false
        });
      } catch (e) {
        console.error('[ClubTeamCard] Error fetching stats for ' + team.id, e);
        setStats(s => ({ ...s, loading: false }));
      }
    };

    fetchStats();
  }, [team.id]);

  const tier = team.subscriptionTier || 'Starter';

  return (
    <Card className="group hover:border-purple-500/30 transition-all duration-300 p-0 overflow-hidden bg-zinc-900/20 backdrop-blur-sm">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black italic shadow-xl border border-white/5"
            style={{ backgroundColor: team.settings?.homeColor || '#3b82f6', color: '#fff' }}
          >
            {team.name?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{team.name}</h3>
              <Badge variant={tier === 'elite' ? 'purple' : 'zinc'} className="text-[8px] px-2 py-0.5">
                {tier}
              </Badge>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">
              {stats.loading ? (
                <span className="animate-pulse">Synchronisiere...</span>
              ) : (
                `${stats.memberCount} MITGLIEDER • ${stats.gameCount} SPIELE IM ARCHIV`
              )}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => onSelect(team.id)}
          className="p-3 bg-zinc-800/50 hover:bg-purple-500/10 hover:text-purple-400 rounded-xl transition-all group-hover:translate-x-1 border border-zinc-800"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-3 bg-black/40 border-t border-zinc-800/50 px-6 py-4">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Saison Tore</span>
          <span className="text-sm font-black text-zinc-100 italic">{stats.totalGoals}</span>
        </div>
        <div className="flex flex-col border-x border-zinc-800/50 px-6">
          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Win Rate</span>
          <span className="text-sm font-black text-zinc-100 italic">{stats.winRate}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Status</span>
          <span className={`text-[10px] font-black uppercase italic ${team.isLive ? 'text-green-500 animate-pulse' : 'text-zinc-500'}`}>
            {team.isLive ? 'Live Tracking' : 'Standby'}
          </span>
        </div>
      </div>
    </Card>
  );
};

const ClubDashboard = () => {
  const { profile, allTeams, setActiveTeam, user, createTeam, fetchAllTeams } = useStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  // Ensure teams are loaded when mounting the dashboard
  React.useEffect(() => {
    if (allTeams.length === 0 && user?.uid) {
      console.log('[ClubDashboard] No teams in store, triggering fetch...');
      fetchAllTeams();
    }
  }, [allTeams.length, user?.uid]);
  
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const res = await createTeam({
        teamName: newTeamName,
        teamColor: '#84cc16',
        playerName: profile?.playerName || 'Club Admin'
      });
      
      if (res.success) {
        setIsCreateModalOpen(false);
        setNewTeamName('');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const myTeams = allTeams || [];
  const isClubOwner = myTeams.some(t => t.ownerUid === user?.uid);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 py-4 border-b border-purple-500/10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-white leading-none">Club Management</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Zentrale Verwaltung & Analytics</p>
          </div>
        </div>
        
        {isClubOwner && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20 border border-purple-400/20"
          >
            <Plus size={16} />
            Neues Team
          </button>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/40 border-zinc-800/50 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mannschaften</p>
            <p className="text-2xl font-black text-white italic">{myTeams.length}</p>
          </div>
        </Card>
        
        <Card className="bg-zinc-900/40 border-zinc-800/50 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Premium Status</p>
            <p className="text-2xl font-black text-purple-400 italic">ELITE</p>
          </div>
        </Card>

        <Card className="bg-zinc-900/40 border-zinc-800/50 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">System Status</p>
            <p className="text-2xl font-black text-green-400 italic uppercase">Bereit</p>
          </div>
        </Card>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {myTeams.map(team => (
          <ClubTeamCard 
            key={team.id} 
            team={team} 
            onSelect={setActiveTeam}
          />
        ))}
      </div>

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-white uppercase italic mb-2">Neues Team gründen</h2>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-10">Erweitere deinen Club um eine weitere Mannschaft.</p>
            
            <form onSubmit={handleCreateTeam} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Name der Mannschaft</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="z.B. 2. Herren"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-5 text-white font-bold focus:border-purple-500 outline-none transition-all placeholder:text-zinc-700"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-6 py-5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                >
                  Abbrechen
                </button>
                <button 
                  type="submit"
                  disabled={!newTeamName.trim() || isCreating}
                  className="flex-[2] px-6 py-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-purple-600/30"
                >
                  {isCreating ? 'Erstelle...' : 'Team anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDashboard;
