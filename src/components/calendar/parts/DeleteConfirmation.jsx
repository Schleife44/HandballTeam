import React from 'react';
import { AlertCircle } from 'lucide-react';

const DeleteConfirmation = ({ confirmDelete, setConfirmDelete, executeDeletion }) => {
  if (!confirmDelete.type) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[99999] animate-in fade-in duration-500">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
        onClick={() => setConfirmDelete({ type: null, id: null, title: '' })} 
      />
      <div className="relative bg-zinc-950 border border-zinc-900 w-full max-w-md p-10 rounded-[3rem] shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out">
        <div className="space-y-8 text-center">
          <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex flex-col items-center gap-4">
            <AlertCircle size={48} className="text-red-500" />
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/60">Bestätigung</p>
              <p className="text-base font-bold text-zinc-100 leading-tight">
                Möchtest du "{confirmDelete.title}" wirklich löschen?
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setConfirmDelete({ type: null, id: null, title: '' })} 
              className="py-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase text-zinc-400 hover:bg-zinc-800 transition-all active:scale-95"
            >
              Abbrechen
            </button>
            <button 
              onClick={() => {
                executeDeletion(confirmDelete.type, confirmDelete.id);
                setConfirmDelete({ type: null, id: null, title: '' });
              }} 
              className="py-5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 transition-all shadow-xl active:scale-95"
            >
              Ja, löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
