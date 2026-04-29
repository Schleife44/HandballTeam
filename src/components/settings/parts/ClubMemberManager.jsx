import React, { useState, useEffect } from 'react';
import { db } from '../../../services/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { Shield, Users, UserPlus, Star, Trash2, Loader2, Search, Building2 } from 'lucide-react';
import useStore from '../../../store/useStore';
import Button from '../../ui/Button';

const ClubMemberManager = () => {
  const { allTeams, user } = useStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClubMembers();
  }, [allTeams]);

  const fetchClubMembers = async () => {
    if (!allTeams || allTeams.length === 0) return;
    setLoading(true);
    
    try {
      const allMembersData = [];
      const processedUids = new Set();

      // For each team, fetch its members
      for (const team of allTeams) {
        const membersRef = collection(db, 'teams', team.teamId, 'members');
        const snap = await getDocs(membersRef);
        
        snap.forEach(doc => {
          const data = doc.data();
          const uid = doc.id;
          
          // Add team info to member
          const memberWithTeam = {
            ...data,
            uid,
            teamName: team.teamName,
            teamId: team.teamId
          };
          
          allMembersData.push(memberWithTeam);
        });
      }

      setMembers(allMembersData);
    } catch (e) {
      console.error('[ClubMemberManager] Fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (teamId, memberUid, newRole) => {
    try {
      const memberRef = doc(db, 'teams', teamId, 'members', memberUid);
      await updateDoc(memberRef, { role: newRole });
      
      // Update local state
      setMembers(prev => prev.map(m => 
        (m.uid === memberUid && m.teamId === teamId) ? { ...m, role: newRole } : m
      ));
    } catch (e) {
      console.error('[ClubMemberManager] Role update failed:', e);
    }
  };

  const filteredMembers = members.filter(m => 
    m.playerName?.toLowerCase().includes(search.toLowerCase()) || 
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.teamName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="text-purple-500 animate-spin" size={32} />
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sammle Mitgliederdaten...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Stats */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase italic text-white">Club-Mitglieder</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{members.length} Personen in {allTeams.length} Teams</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input 
            type="text" 
            placeholder="Name oder Team suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs font-bold focus:border-purple-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMembers.map((member, idx) => (
          <div key={`${member.uid}-${member.teamId}`} className="group bg-zinc-900/30 border border-zinc-800/50 hover:border-purple-500/30 rounded-3xl p-6 transition-all hover:bg-zinc-900/50 flex flex-col md:flex-row items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-black text-sm uppercase">
              {member.playerName?.substring(0, 2)}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-base font-black text-white uppercase italic">{member.playerName || 'Unbekannt'}</h4>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-[9px] font-black text-zinc-400 uppercase tracking-tighter">
                  {member.teamName}
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-[9px] font-black text-purple-400 uppercase tracking-tighter">
                  {member.role || 'Mitglied'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 font-mono mt-1">{member.email}</p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => updateRole(member.teamId, member.uid, member.role === 'trainer' ? 'spieler' : 'trainer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  member.role === 'trainer' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <Shield size={12} />
                {member.role === 'trainer' ? 'Trainer-Rechte entziehen' : 'Zum Trainer befördern'}
              </button>
            </div>
          </div>
        ))}

        {filteredMembers.length === 0 && (
          <div className="py-12 text-center text-zinc-600 italic">Keine passenden Mitglieder gefunden.</div>
        )}
      </div>
    </div>
  );
};

export default ClubMemberManager;
