import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Users, 
  Shield, 
  BarChart3, 
  TrendingUp, 
  Package, 
  AlertCircle,
  Search,
  Trash2
} from 'lucide-react';
import useStore from '../../store/useStore';

const AdminDashboard = () => {
  const { user } = useStore();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOwners, setExpandedOwners] = useState({});
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPro: 0,
    totalElite: 0,
    totalStarter: 0,
    estimatedRevenue: 0
  });

  const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || '1gTmo9rM4FMZitP8YAcTDMHadT02';
  const isAuthorized = user?.uid === ADMIN_UID;

  useEffect(() => {
    if (isAuthorized) {
      fetchAdminData();
    }
  }, [isAuthorized]);

  const toggleOwner = (ownerUid) => {
    setExpandedOwners(prev => ({ ...prev, [ownerUid]: !prev[ownerUid] }));
  };

  const updateTeamTier = async (teamId, newTier) => {
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        subscriptionTier: newTier,
        updatedAt: new Date().toISOString()
      });
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, subscriptionTier: newTier } : t));
    } catch (e) {
      console.error('[Admin] Update failed:', e);
    }
  };

  const deleteTeamAdmin = async (teamId, teamName) => {
    if (!window.confirm(`Möchtest du das Team "${teamName}" wirklich UNWIDERRUFLICH löschen? Alle Daten gehen verloren.`)) {
      return;
    }

    try {
      const teamRef = doc(db, 'teams', teamId);
      await deleteDoc(teamRef);
      setTeams(prev => prev.filter(t => t.id !== teamId));
      alert(`Team "${teamName}" wurde gelöscht.`);
    } catch (e) {
      console.error('[Admin] Delete failed:', e);
      alert('Fehler beim Löschen: ' + e.message);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const teamsRef = collection(db, 'teams');
      const snap = await getDocs(teamsRef);
      const teamsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setTeams(teamsList);
      
      const pro = teamsList.filter(t => t.subscriptionTier === 'pro').length;
      const elite = teamsList.filter(t => t.subscriptionTier === 'elite').length;
      const starter = teamsList.filter(t => t.subscriptionTier === 'starter' || !t.subscriptionTier).length;
      
      setStats({
        totalTeams: teamsList.length,
        totalPro: pro,
        totalElite: elite,
        totalStarter: starter,
        estimatedRevenue: (pro * 19.90) + (elite * 59.90)
      });
    } catch (e) {
      console.error('[Admin] Fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // Group teams by owner
  const groupedTeams = teams.reduce((acc, team) => {
    const owner = team.ownerUid || 'no-owner';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(team);
    return acc;
  }, {});

  const sortedOwners = Object.keys(groupedTeams).sort((a, b) => {
    const aElite = groupedTeams[a].some(t => t.subscriptionTier === 'elite');
    const bElite = groupedTeams[b].some(t => t.subscriptionTier === 'elite');
    if (aElite && !bElite) return -1;
    if (!aElite && bElite) return 1;
    return 0;
  });

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020202] p-6 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Zugriff Verweigert</h1>
        <p className="text-zinc-400 max-w-md">
          Keine Berechtigung. UID: <code className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">{user?.uid || 'N/A'}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter italic">Admin <span className="text-brand">Terminal</span></h1>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mt-1">SaaS Infrastructure Management</p>
          </div>
          <button 
            onClick={fetchAdminData}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
          >
            Refresh <BarChart3 size={16} />
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Gesamt Teams" value={stats.totalTeams} icon={<Users />} color="text-blue-500" />
          <StatCard title="Pro Abos" value={stats.totalPro} icon={<Package />} color="text-brand" />
          <StatCard title="Elite Abos" value={stats.totalElite} icon={<Shield />} color="text-purple-500" />
          <StatCard title="Monats-Umsatz" value={`${stats.estimatedRevenue.toFixed(2)}€`} icon={<TrendingUp />} color="text-green-500" />
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl">
            <h2 className="text-xl font-black uppercase italic">Club Hierarchy</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input 
                type="text" 
                placeholder="Search Clubs..."
                className="bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold focus:border-brand outline-none w-64 transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Club / Principal Team</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-center">Nodes</th>
                  <th className="px-8 py-5">Principal ID</th>
                  <th className="px-8 py-5 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {sortedOwners.map(ownerUid => {
                  const ownerTeams = groupedTeams[ownerUid];
                  const isExpanded = expandedOwners[ownerUid];
                  const isElite = ownerTeams.some(t => t.subscriptionTier === 'elite');
                  const clubName = ownerTeams[0].name;

                  return (
                    <React.Fragment key={ownerUid}>
                      {/* PARENT ROW: THE CLUB */}
                      <tr className={`group transition-all ${isElite ? 'bg-purple-500/10 border-l-4 border-purple-500' : 'hover:bg-white/5 border-l-4 border-zinc-800'}`}>
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-6">
                            <button 
                              onClick={() => toggleOwner(ownerUid)}
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border ${
                                isExpanded 
                                ? 'bg-brand text-black border-brand rotate-180' 
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                              }`}
                            >
                              <TrendingUp size={18} className={isExpanded ? 'rotate-90' : ''} />
                            </button>
                            <div>
                              <p className="font-black uppercase italic text-lg text-white tracking-tighter">{clubName} <span className="text-zinc-600">Organization</span></p>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Principal ID: {ownerUid.slice(0, 8)}...{ownerUid.slice(-4)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-2">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                              isElite ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40' :
                              ownerTeams.some(t => t.subscriptionTier === 'pro') ? 'bg-brand text-black' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {isElite ? 'Elite Club' : 'Standard Club'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-8 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-2xl font-black text-white leading-none">{ownerTeams.length}</span>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">Units</span>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-zinc-600 uppercase">Status</span>
                              <span className="text-[10px] font-bold text-green-500 uppercase italic">Linked & Active</span>
                           </div>
                        </td>
                        <td className="px-8 py-8 text-right">
                           <button 
                             onClick={() => toggleOwner(ownerUid)}
                             className="px-6 py-2 bg-zinc-800 hover:bg-white hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                           >
                             {isExpanded ? 'Close Management' : 'Manage Organization'}
                           </button>
                        </td>
                      </tr>
                      
                      {/* CHILD ROWS: THE TEAMS */}
                      {isExpanded && ownerTeams.map((team, idx) => (
                        <tr key={team.id} className="bg-black/60 border-l-4 border-brand/30 animate-in slide-in-from-top-2 duration-300">
                          <td className="px-24 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-black uppercase italic text-zinc-200">{team.name}</p>
                                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Service Unit</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                team.subscriptionTier === 'elite' ? 'bg-purple-500' :
                                team.subscriptionTier === 'pro' ? 'bg-brand' : 'bg-zinc-700'
                              }`} />
                              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{team.subscriptionTier || 'starter'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center text-[9px] font-mono text-zinc-700">
                            {team.id}
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex gap-1">
                               <button onClick={() => updateTeamTier(team.id, 'starter')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-md text-[8px] font-black text-zinc-500">S</button>
                               <button onClick={() => updateTeamTier(team.id, 'pro')} className="px-2 py-1 bg-brand/10 hover:bg-brand rounded-md text-[8px] font-black text-brand hover:text-black">P</button>
                               <button onClick={() => updateTeamTier(team.id, 'elite')} className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500 rounded-md text-[8px] font-black text-purple-400 hover:text-white">E</button>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button 
                               onClick={() => deleteTeamAdmin(team.id, team.name)}
                               className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                             >
                               <Trash2 size={14} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:border-zinc-700 transition-all group">
    <div className="flex items-center justify-between mb-6">
      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
      <div className={`${color} bg-zinc-950 border border-zinc-800 p-3 rounded-2xl group-hover:scale-110 transition-transform shadow-xl`}>{icon}</div>
    </div>
    <span className="text-4xl font-black italic tracking-tighter text-zinc-100">{value}</span>
  </div>
);

export default AdminDashboard;
