import React from 'react';
import { 
  Link, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Clock3, 
  Plus, 
  Loader2 
} from 'lucide-react';
import Modal from '../../ui/Modal';

const ManagementHub = ({ 
  isOpen, 
  onClose, 
  newAbo, 
  setNewAbo, 
  handleImportICS, 
  isSyncing, 
  subscriptions, 
  series, 
  editingSeriesId, 
  setEditingSeriesId, 
  tempSeriesTitle, 
  setTempSeriesTitle, 
  saveSeriesTitle, 
  setConfirmDelete 
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Kalender verwalten">
      <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out space-y-8 max-h-[80vh] overflow-y-auto no-scrollbar pr-2">
        {/* Abo Section */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Neues Abo hinzufügen</h4>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newAbo.url} 
              onChange={(e) => setNewAbo({...newAbo, url: e.target.value})} 
              placeholder="https://... (ICS/Webcal)" 
              className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-brand transition-all text-xs font-mono" 
            />
            <button 
              onClick={handleImportICS} 
              disabled={isSyncing} 
              className="p-4 bg-brand text-black rounded-2xl hover:bg-brand-light transition-all active:scale-95"
            >
              {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} strokeWidth={3} />}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setNewAbo({...newAbo, isMandatory: !newAbo.isMandatory})} 
              className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all flex items-center justify-center gap-2 ${newAbo.isMandatory ? 'bg-brand/10 border-brand text-brand' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
            >
              <ShieldCheck size={14} /> Grundpflicht
            </button>
            <button 
              onClick={() => setNewAbo({...newAbo, isAutoGoing: !newAbo.isAutoGoing})} 
              className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all flex items-center justify-center gap-2 ${newAbo.isAutoGoing ? 'bg-brand/10 border-brand text-brand' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
            >
              <Zap size={14} /> Auto-Dabei
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Clock3 size={14} className="text-zinc-600" />
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Abmeldefrist (Std.)</span>
              </div>
              <input 
                type="number" 
                value={newAbo.deadline} 
                onChange={(e) => setNewAbo({...newAbo, deadline: parseInt(e.target.value) || 0})} 
                className="w-full bg-black/20 border border-zinc-800 p-2 rounded-xl text-center text-zinc-100 text-xs font-bold focus:border-brand/50 outline-none" 
              />
            </div>
            <div className="flex flex-col gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-zinc-600" />
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Treffen (Min. vorher)</span>
              </div>
              <input 
                type="number" 
                value={newAbo.meetingOffset} 
                onChange={(e) => setNewAbo({...newAbo, meetingOffset: parseInt(e.target.value) || 0})} 
                className="w-full bg-black/20 border border-zinc-800 p-2 rounded-xl text-center text-zinc-100 text-xs font-bold focus:border-brand/50 outline-none" 
              />
            </div>
          </div>
        </section>

        {/* List Section */}
        <section className="space-y-4 pt-6 border-t border-zinc-900">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Aktive Abos & Serien</h4>
          <div className="space-y-3">
            {subscriptions.map(s => (
              <div key={s.id} className="p-5 bg-brand/5 border border-brand/20 rounded-3xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-brand/10 rounded-xl"><Link size={16} className="text-brand" /></div>
                  <div>
                    <p className="text-xs font-black text-zinc-100">{s.title}</p>
                    <p className="text-[9px] font-bold text-zinc-600 truncate max-w-[150px] uppercase">{s.url}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'abo', id: s.id, title: s.title }); }} 
                  className="p-2 text-zinc-600 hover:text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {series.map(s => (
              <div key={s.id} className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl flex items-center justify-between group shadow-lg">
                <div className="flex-1">
                  {editingSeriesId === s.id ? (
                    <div className="flex items-center gap-2 pr-4">
                      <input 
                        autoFocus 
                        type="text" 
                        value={tempSeriesTitle} 
                        onChange={(e) => setTempSeriesTitle(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && saveSeriesTitle(s.id)} 
                        className="flex-1 bg-black/40 border border-brand/50 p-2 rounded-xl text-xs text-zinc-100 outline-none" 
                      />
                      <button onClick={() => saveSeriesTitle(s.id)} className="p-2 bg-brand text-black rounded-lg active:scale-90">
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-black text-zinc-100">{s.title}</p>
                      <p className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-tighter">{s.rule}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { setEditingSeriesId(s.id); setTempSeriesTitle(s.title); }} 
                    className="p-2.5 text-zinc-600 hover:text-zinc-100 transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'series', id: s.id, title: s.title }); }} 
                    className="p-2.5 text-zinc-600 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default ManagementHub;
