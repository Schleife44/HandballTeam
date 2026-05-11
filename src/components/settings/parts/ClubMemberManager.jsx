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
        const teamId = team.id || team.teamId; // Fallback for safety
        if (!teamId) continue;

        const membersRef = collection(db, 'teams', teamId, 'members');
        const snap = await getDocs(membersRef);
        
        snap.forEach(doc => {
          const data = doc.data();
          const uid = doc.id;
          
          // Avoid duplicate entries in the global list if user is in multiple teams
          // (Though we might want to show them per team as in the current UI)
          const memberWithTeam = {
            ...data,
            uid,
            teamName: team.name || team.teamName,
            teamId: teamId
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

  const filteredTeams = allTeams.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    members.some(m => m.teamId === t.id && (m.playerName?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())))
  );

  const addExistingToTeam = async (memberUid, memberData, teamId) => {
    try {
      const memberRef = doc(db, 'teams', teamId, 'members', memberUid);
      const newMemberData = {
        playerName: memberData.playerName,
        email: memberData.email,
        role: 'spieler',
        joinedAt: new Date().toISOString()
      };
      await updateDoc(memberRef, newMemberData);
      fetchClubMembers();
    } catch (e) {
      console.error('[ClubMemberManager] Add existing failed:', e);
    }
  };

  const removeFromTeam = async (teamId, memberUid) => {
    if (!window.confirm('Mitglied wirklich aus diesem Team entfernen?')) return;
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'teams', teamId, 'members', memberUid));
      fetchClubMembers();
    } catch (e) {
      console.error('[ClubMemberManager] Remove failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="text-purple-500 animate-spin" size={32} />
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sammle Mitgliederdaten...</p>
      </div>
    );
  }

  // Get all unique members for the "Add existing" dropdown
  const allUniqueMembers = Object.values(members.reduce((acc, m) => {
    if (!acc[m.uid]) acc[m.uid] = m;
    return acc;
  }, {}));

  return (
    <div className="space-y-10">
      {/* Search & Stats */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase italic text-white">Team-Struktur & Rechte</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {allTeams.length} Mannschaften • {allUniqueMembers.length} Aktive Personen
            </p>
          </div>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input 
            type="text" 
            placeholder="Name, E-Mail oder Team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs font-bold focus:border-purple-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Teams Grid */}
      <div className="space-y-12">
        {filteredTeams.map((team) => {
          // Filter members based on search
          const teamMembers = members.filter(m => {
            if (m.teamId !== team.id) return false;
            if (!search) return true;
            
            const searchLower = search.toLowerCase();
            const matchesTeam = team.name?.toLowerCase().includes(searchLower);
            const matchesPlayer = m.playerName?.toLowerCase().includes(searchLower) || m.email?.toLowerCase().includes(searchLower);
            
            // If team name matches, show all. If not, only show matching players.
            return matchesTeam || matchesPlayer;
          });
          
          if (teamMembers.length === 0) return null;
          
          return (
            <div key={team.id} className="space-y-4">
              {/* Team Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black italic shadow-lg"
                    style={{ backgroundColor: team.settings?.homeColor || '#84cc16', color: '#000' }}
                  >
                    {team.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tight">{team.name}</h4>
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">{teamMembers.length} Mitglieder</span>
                </div>

                {/* Add Member Dropdown */}
                <div className="relative">
                  <select 
                    className="appearance-none bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest pl-4 pr-10 py-2.5 rounded-xl border border-zinc-800 outline-none cursor-pointer transition-all"
                    onChange={(e) => {
                      if (e.target.value) {
                        const m = allUniqueMembers.find(um => um.uid === e.target.value);
                        addExistingToTeam(e.target.value, m, team.id);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>+ Mitglied hinzufügen</option>
                    <optgroup label="Bestehende Club-Mitglieder">
                      {allUniqueMembers
                        .filter(um => !teamMembers.some(tm => tm.uid === um.uid))
                        .map(um => (
                          <option key={um.uid} value={um.uid}>{um.playerName}</option>
                        ))
                      }
                    </optgroup>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                    <UserPlus size={12} />
                  </div>
                </div>
              </div>

              {/* Members of this team */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => {
                  const isOwner = member.uid === team.ownerUid;
                  const isMe = member.uid === user?.uid;

                  return (
                    <div key={`${member.uid}-${team.id}`} className="group bg-zinc-900/30 border border-zinc-800/50 hover:border-purple-500/30 rounded-[1.5rem] p-5 transition-all flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 font-black text-xs uppercase">
                        {member.playerName?.substring(0, 2)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-black text-white uppercase italic truncate">{member.playerName || 'Unbekannt'}</h5>
                        <p className="text-[9px] text-zinc-600 font-mono truncate">{member.email}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        {isOwner ? (
                          <div className="px-2 py-1 bg-purple-500/10 rounded-lg text-[7px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
                            <Shield size={8} /> Besitzer
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => updateRole(team.id, member.uid, member.role === 'trainer' ? 'spieler' : 'trainer')}
                              className={`p-2 rounded-lg transition-all ${
                                member.role === 'trainer' 
                                  ? 'bg-brand text-black shadow-lg shadow-brand/20' 
                                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                              }`}
                              title={member.role === 'trainer' ? 'Trainer (Rechte entziehen)' : 'Zum Trainer befördern'}
                            >
                              {member.role === 'trainer' ? <Star size={12} fill="currentColor" /> : <Shield size={12} />}
                            </button>
                            {!isMe && (
                              <button 
                                onClick={() => removeFromTeam(team.id, member.uid)}
                                className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                                title="Aus Team entfernen"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredTeams.length === 0 && (
          <div className="py-20 text-center space-y-4 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[2rem]">
            <Search size={40} className="mx-auto text-zinc-700" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Keine Teams oder Mitglieder gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubMemberManager;
