import React from 'react';
import { Layout, Type, ArrowUp, Share2, ArrowDown, Move, Download } from 'lucide-react';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

const PreviewTab = ({ 
  previewMode, 
  setPreviewMode, 
  settings, 
  updateSettings, 
  generateCaption, 
  onFinalSave 
}) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4">
      {/* SIMULATION */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 flex items-center gap-2">
          <Layout size={14} className="text-brand" /> Ergebnis-Simulation
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'actual', label: 'Echt-Daten', icon: Layout },
            { id: 'win', label: 'Heimsieg', icon: ArrowUp },
            { id: 'away_win', label: 'Auswärtssieg', icon: Share2 },
            { id: 'loss', label: 'Niederlage', icon: ArrowDown },
            { id: 'draw', label: 'Unentschieden', icon: Move }
          ].map(p => (
            <button key={p.id} onClick={() => setPreviewMode(p.id)} className={`flex items-center gap-3 p-4 rounded-2xl text-[9px] font-black uppercase transition-all ${previewMode === p.id ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'bg-black/40 text-zinc-500 hover:bg-zinc-800'}`} >
              <p.icon size={14} /> {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* INSTAGRAM CAPTION */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 flex items-center gap-2">
          <Type size={14} className="text-brand" /> Instagram Text
        </label>
        
        <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
          <div>
            <label className="text-[9px] font-bold text-zinc-400 uppercase">Hashtags</label>
            <Input 
              placeholder="#deinverein #heimsieg..." 
              value={settings.hashtags || ''} 
              onChange={(e) => updateSettings({ hashtags: e.target.value })} 
              className="mt-1 h-9 text-[10px]"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-zinc-400 uppercase">Torschützen</label>
            <Select 
              value={settings.scorerFormat || 'last_name'} 
              onChange={(e) => updateSettings({ scorerFormat: e.target.value })} 
              options={[
                { value: 'none', label: 'Nicht anzeigen' },
                { value: 'last_name', label: 'Nur Nachname' },
                { value: 'full_name', label: 'Vor- & Nachname' }
              ]} 
              className="mt-1 h-9 text-[10px]"
            />
          </div>
        </div>

        <div className="relative group">
          <textarea 
            readOnly
            value={generateCaption()}
            className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-6 text-[11px] font-medium text-zinc-300 h-48 outline-none focus:border-brand/30 transition-all resize-none leading-relaxed"
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button onClick={() => {
              navigator.clipboard.writeText(generateCaption());
            }} variant="brand" className="px-4 py-2 rounded-xl text-[8px] font-black uppercase shadow-xl">
              Kopieren
            </Button>
          </div>
        </div>
      </div>

      {/* FINAL EXPORT */}
      <div className="pt-4">
        <Button onClick={onFinalSave} variant="brand" className="w-full py-6 rounded-[2rem] text-xs font-black uppercase italic tracking-widest shadow-2xl shadow-brand/20 group">
          <Download size={18} className="mr-3 group-hover:bounce transition-transform" /> Bild Final Speichern
        </Button>
      </div>
    </div>
  );
};

export default PreviewTab;
