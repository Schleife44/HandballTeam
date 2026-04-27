import React, { useState } from 'react';
import { 
  Shield, User, Trash2, 
  ChevronDown, Crown, Star, Heart, Banknote, ShieldCheck, AlertCircle, X, Check, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../../store/useStore';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';

const FUNCTIONS = [
  { id: 'spieler', name: 'Spieler', icon: User, color: 'zinc' },
  { id: 'kassenwart', name: 'Kassenwart', icon: Banknote, color: 'emerald' },
  { id: 'physio', name: 'Physio', icon: Heart, color: 'rose' },
  { id: 'co-trainer', name: 'Co-Trainer', icon: Star, color: 'blue' },
  { id: 'kapitaen', name: 'Kapitän', icon: Crown, color: 'amber' },
  { id: 'pressewart', name: 'Pressewart', icon: Camera, color: 'purple' },
];

const MemberManager = () => {
  const { 
    allMembers, 
    activeMember, 
    squad, 
    kickMember, 
    updateMemberRole, 
    updateMemberFunction,
    fetchAllMembers
  } = useStore();

  const [isUpdating, setIsUpdating] = useState(null);
  const [confirmKick, setConfirmKick] = useState(null); 
  const [errorMsg, setErrorMsg] = useState(null);
  const [openMenuUid, setOpenMenuUid] = useState(null); // Click-based state

  const ownerUid = squad?.ownerUid || '';
  const myUid = activeMember?.uid || '';
  const myRole = activeMember?.role || 'spieler';
  const isOwner = myUid === ownerUid;
  const isTrainer = myRole === 'trainer' || isOwner;

  const handleUpdateRole = async (uid, currentRole) => {
    if (!isOwner) return;
    const newRole = currentRole === 'trainer' ? 'spieler' : 'trainer';
    setIsUpdating(uid);
    await updateMemberRole(uid, newRole);
    await fetchAllMembers();
    setIsUpdating(null);
  };

  const handleToggleFunction = async (uid, funcId, currentFunctions = []) => {
    if (!isTrainer) return;
    const functions = Array.isArray(currentFunctions) ? [...currentFunctions] : (currentFunctions ? [currentFunctions] : []);
    const newFunctions = functions.includes(funcId) ? functions.filter(f => f !== funcId) : [...functions, funcId];
    setIsUpdating(uid);
    await updateMemberFunction(uid, newFunctions);
    await fetchAllMembers();
    setIsUpdating(null);
  };

  const handleKickAttempt = (member) => {
    if (!isTrainer) return;
    if (member.uid === ownerUid) {
      setErrorMsg('Der Super-Admin kann nicht entfernt werden.');
      return;
    }
    setConfirmKick(member);
  };

  const executeKick = async () => {
    if (!confirmKick) return;
    setIsUpdating(confirmKick.uid);
    await kickMember(confirmKick.uid);
    await fetchAllMembers();
    setIsUpdating(null);
    setConfirmKick(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {allMembers.map((member) => {
          const isMemberOwner = member.uid === ownerUid;
          const isMemberTrainer = member.role === 'trainer';
          const canManage = isOwner || (isTrainer && !isMemberOwner && !isMemberTrainer);
          const memberFunctions = Array.isArray(member.function) ? member.function : (member.function ? [member.function] : []);
          const isMenuOpen = openMenuUid === member.uid;

          return (
            <div 
              key={member.uid}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between relative
                ${member.uid === myUid ? 'bg-brand/10 border-brand/30' : 'bg-zinc-900/40 border-zinc-800'}
                ${isMenuOpen ? 'z-[100]' : 'z-10'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border
                  ${isMemberOwner ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 
                    isMemberTrainer ? 'bg-blue-500/20 border-blue-500/50 text-blue-500' : 
                    'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                  {isMemberOwner ? <Crown size={20} /> : isMemberTrainer ? <ShieldCheck size={20} /> : <User size={20} />}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white uppercase italic tracking-tight">
                      {member.playerName || member.email?.split('@')[0] || 'Unbekannt'}
                    </span>
                    {member.uid === myUid && (
                      <span className="text-[8px] font-black bg-brand text-black px-1.5 py-0.5 rounded uppercase">Du</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border
                      ${isMemberOwner ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 
                        isMemberTrainer ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 
                        'bg-zinc-800/50 border-zinc-700 text-zinc-500'}`}>
                      {isMemberOwner ? 'Super-Admin' : isMemberTrainer ? 'Trainer' : 'Spieler'}
                    </span>
                    {memberFunctions.map(fId => {
                      const func = FUNCTIONS.find(f => f.id === fId);
                      if (!func || fId === 'spieler') return null;
                      return (
                        <span key={fId} className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1
                          ${func.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 
                            func.color === 'rose' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 
                            func.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 
                            func.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                            func.color === 'purple' ? 'bg-purple-500/10 border-purple-500/30 text-purple-500' :
                            'bg-zinc-800/50 border-zinc-700 text-zinc-500'}`}>
                          <func.icon size={10} />
                          {func.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-2">
                  {/* Function Selector (Click-based) */}
                  <div className="relative">
                    <button 
                      onClick={() => setOpenMenuUid(isMenuOpen ? null : member.uid)}
                      className={`h-8 px-3 rounded-lg border transition-all flex items-center gap-2
                        ${isMenuOpen ? 'bg-brand text-black border-brand' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}
                    >
                      <ChevronDown size={14} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                      <span className="text-[10px] font-bold uppercase">Funktion</span>
                    </button>
                    
                    <AnimatePresence>
                      {isMenuOpen && (
                        <>
                          {/* Invisible Backdrop to close on click outside */}
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuUid(null)} />
                          
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-brand/30 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 backdrop-blur-xl"
                          >
                            <div className="p-3 border-b border-zinc-800 bg-black/40 flex justify-between items-center">
                              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Funktionen wählen</span>
                              <button onClick={() => setOpenMenuUid(null)} className="text-zinc-600 hover:text-white"><X size={12} /></button>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                              {FUNCTIONS.filter(f => f.id !== 'spieler').map(f => (
                                <button
                                  key={f.id}
                                  onClick={() => handleToggleFunction(member.uid, f.id, member.function)}
                                  className={`w-full px-4 py-4 text-left text-[10px] font-bold uppercase flex items-center justify-between hover:bg-zinc-800 transition-colors
                                    ${memberFunctions.includes(f.id) ? 'text-brand bg-brand/5' : 'text-zinc-400'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <f.icon size={14} />
                                    {f.name}
                                  </div>
                                  {memberFunctions.includes(f.id) ? (
                                    <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center text-black">
                                      <Check size={12} strokeWidth={4} />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border border-zinc-700" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {isOwner && member.uid !== myUid && (
                    <button 
                      onClick={() => handleUpdateRole(member.uid, member.role)}
                      className={`h-8 px-3 rounded-lg border transition-all flex items-center gap-2
                        ${isMemberTrainer ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                    >
                      <Shield size={14} />
                    </button>
                  )}

                  <button 
                    onClick={() => handleKickAttempt(member)}
                    className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                    disabled={isUpdating === member.uid}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={!!confirmKick}
        onClose={() => setConfirmKick(null)}
        title="Mitglied entfernen"
        footer={
          <div className="flex gap-4 w-full">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmKick(null)}>Abbrechen</Button>
            <Button variant="danger" className="flex-1" onClick={executeKick}>Mitglied kicken</Button>
          </div>
        }
      >
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle size={32} />
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Möchtest du <span className="text-white font-bold">{confirmKick?.playerName}</span> wirklich aus dem Team entfernen? 
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={!!errorMsg}
        onClose={() => setErrorMsg(null)}
        title="Aktion nicht möglich"
        footer={<Button variant="primary" className="w-full" onClick={() => setErrorMsg(null)}>Verstanden</Button>}
      >
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <AlertCircle size={32} />
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">{errorMsg}</p>
        </div>
      </Modal>
    </div>
  );
};

export default MemberManager;
