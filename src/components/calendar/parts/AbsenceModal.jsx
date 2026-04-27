import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../../ui/Modal';

const AbsenceModal = ({ 
  isOpen, 
  onClose, 
  absenceData, 
  setAbsenceData, 
  handleAddAbsence, 
  absences, 
  setAbsences 
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Abwesenheit verwalten">
      <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Typ</label>
            <select 
              value={absenceData.type} 
              onChange={(e) => setAbsenceData({...absenceData, type: e.target.value})} 
              className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-zinc-100 text-xs"
            >
              <option value="Einmalig">Einmalig</option>
              <option value="Wöchentlich">Wöchentlich</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Grund</label>
            <input 
              type="text" 
              value={absenceData.reason} 
              onChange={(e) => setAbsenceData({...absenceData, reason: e.target.value})} 
              placeholder="z.B. Urlaub" 
              className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-zinc-100 text-xs outline-none focus:border-brand" 
            />
          </div>
        </div>

        {absenceData.type === 'Einmalig' ? (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Von</label>
              <input 
                type="date" 
                value={absenceData.start} 
                onChange={(e) => setAbsenceData({...absenceData, start: e.target.value})} 
                className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-zinc-100 text-xs" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Bis</label>
              <input 
                type="date" 
                value={absenceData.end} 
                onChange={(e) => setAbsenceData({...absenceData, end: e.target.value})} 
                className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-zinc-100 text-xs" 
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 animate-in fade-in duration-300">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Wochentag</label>
            <select 
              value={absenceData.day} 
              onChange={(e) => setAbsenceData({...absenceData, day: e.target.value})} 
              className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-zinc-100 text-xs"
            >
              {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map((d, i) => (
                <option key={i} value={i + 1}>{d}</option>
              ))}
            </select>
          </div>
        )}

        <button 
          onClick={handleAddAbsence} 
          className="w-full py-4 bg-zinc-100 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white transition-all shadow-xl active:scale-95"
        >
          Abwesenheit speichern
        </button>

        <div className="pt-6 border-t border-zinc-900 space-y-2 max-h-40 overflow-y-auto no-scrollbar">
          {absences.map(abs => (
            <div key={abs.id} className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
              <div>
                <p className="text-[10px] font-bold text-zinc-100">{abs.reason}</p>
                <p className="text-[7px] font-black text-zinc-600 uppercase">
                  {abs.type === 'Wöchentlich' ? 'Jede Woche' : 'Zeitraum'}
                </p>
              </div>
              <button 
                onClick={() => setAbsences(absences.filter(a => a.id !== abs.id))} 
                className="p-2 text-zinc-600 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default AbsenceModal;
