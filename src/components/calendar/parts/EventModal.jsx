import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock3 } from 'lucide-react';
import Modal from '../../ui/Modal';

const EventModal = ({ isOpen, onClose, eventData, setEventData, handleSaveEvent, selectedDate, formError }) => {
  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={eventData.id ? 'Termin bearbeiten' : format(selectedDate, 'eeee, dd. MMMM', { locale: de })}
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex-1">
            {formError && (
              <div className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                {formError}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-[9px] font-black uppercase text-zinc-100 border border-zinc-800 hover:bg-zinc-800 transition-all">
              Abbrechen
            </button>
            <button 
              onClick={handleSaveEvent} 
              className="px-6 py-2.5 rounded-xl bg-brand text-black text-[9px] font-black uppercase hover:bg-brand-light shadow-lg transition-all active:scale-95"
            >
              {eventData.id ? 'Aktualisieren' : 'Speichern'}
            </button>
          </div>
        </div>
      }
    >
      <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-5 duration-300 space-y-4">
        <div className="space-y-1">
          <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600 ml-1">Titel</label>
          <input 
            type="text" 
            value={eventData.title} 
            onChange={(e) => setEventData({...eventData, title: e.target.value})} 
            placeholder="Training, Spiel..." 
            className="w-full bg-zinc-900/50 border border-zinc-800 p-2.5 rounded-xl text-zinc-100 outline-none focus:border-brand transition-all text-xs font-medium" 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600 ml-1">Typ</label>
          <div className="grid grid-cols-3 gap-2">
            {['Training', 'Spiel', 'Sonstiges'].map(t => (
              <button 
                key={t} 
                onClick={() => setEventData({...eventData, type: t})} 
                className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${eventData.type?.toUpperCase() === t.toUpperCase() ? 'bg-brand/10 border-brand text-brand' : 'bg-zinc-900/30 border-zinc-800 text-zinc-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600 ml-1">Datum</label>
          <input 
            type="date" 
            value={eventData.date} 
            onChange={(e) => setEventData({...eventData, date: e.target.value})} 
            className="w-full bg-zinc-900/50 border border-zinc-800 p-2.5 rounded-xl text-zinc-100 text-xs focus:border-brand outline-none transition-all" 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600 ml-1">Treffen (Optional)</label>
            <input 
              type="time" 
              value={eventData.meetingTime || ''} 
              onChange={(e) => setEventData({...eventData, meetingTime: e.target.value})} 
              className="w-full bg-zinc-900/50 border border-zinc-800 p-2.5 rounded-xl text-zinc-100 text-xs focus:border-brand outline-none transition-all" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600 ml-1">Beginn</label>
            <input 
              type="time" 
              value={eventData.time} 
              onChange={(e) => setEventData({...eventData, time: e.target.value})} 
              className="w-full bg-zinc-900/50 border border-zinc-800 p-2.5 rounded-xl text-zinc-100 text-xs focus:border-brand outline-none transition-all" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600 ml-1">Ort</label>
            <input 
              type="text" 
              value={eventData.location} 
              onChange={(e) => setEventData({...eventData, location: e.target.value})} 
              placeholder="Halle..." 
              className="w-full bg-zinc-900/50 border border-zinc-800 p-2.5 rounded-xl text-zinc-100 outline-none focus:border-brand transition-all text-xs" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600 ml-1">Wiederholung</label>
            <select 
              disabled={!!eventData.id} 
              value={eventData.repeat} 
              onChange={(e) => setEventData({...eventData, repeat: e.target.value})} 
              className="w-full bg-zinc-900/50 border border-zinc-800 p-2.5 rounded-xl text-zinc-100 outline-none focus:border-brand transition-all text-xs cursor-pointer"
            >
              <option value="Keine">Keine</option>
              <option value="Wöchentlich">Wöchentlich</option>
              <option value="Alle 2 Wochen">Alle 2 Wochen</option>
            </select>
          </div>
        </div>

        {eventData.repeat !== 'Keine' && !eventData.id && (
          <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600 ml-1">Serie Endet am</label>
            <input 
              type="date" 
              value={eventData.endDate} 
              onChange={(e) => setEventData({...eventData, endDate: e.target.value})} 
              className="w-full bg-zinc-900/50 border border-zinc-800 p-2.5 rounded-xl text-zinc-100 text-xs focus:border-brand outline-none transition-all" 
            />
          </div>
        )}

        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setEventData({...eventData, isMandatory: !eventData.isMandatory})} 
              className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all flex items-center justify-center gap-1.5 ${eventData.isMandatory ? 'bg-brand/10 border-brand text-brand' : 'bg-zinc-900/30 border-zinc-800 text-zinc-600'}`}
            >
              Grundpflicht Absage
            </button>
            <button 
              onClick={() => setEventData({...eventData, isAutoGoing: !eventData.isAutoGoing})} 
              className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all flex items-center justify-center gap-1.5 ${eventData.isAutoGoing ? 'bg-brand/10 border-brand text-brand' : 'bg-zinc-900/30 border-zinc-800 text-zinc-600'}`}
            >
              Automatisch Dabei
            </button>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-2">
              <Clock3 size={12} className="text-zinc-600" />
              <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">Abmeldefrist (Std.):</span>
            </div>
            <input 
              type="number" 
              value={eventData.deadline} 
              onChange={(e) => setEventData({...eventData, deadline: e.target.value})} 
              className="w-12 bg-black/20 border border-zinc-800 p-1 rounded-lg text-center text-zinc-100 text-[10px] font-bold" 
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EventModal;
