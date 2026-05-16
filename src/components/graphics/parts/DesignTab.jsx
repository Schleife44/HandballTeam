import React from 'react';
import { Wand2, Plus, Image as ImageIcon, Upload } from 'lucide-react';
import { TEMPLATES, FONTS } from '../graphicsConstants';
import Select from '../../ui/Select';

const DesignTab = ({ settings, applyTemplate, addElement, updateSettings }) => {
  return (
    <div className="space-y-10 animate-in slide-in-from-left-4">
      {/* PRESETS */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Design Presets</label>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => applyTemplate(t.id)} className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-brand transition-all flex flex-col items-center justify-center bg-black/40">
              <div className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity" style={{ backgroundColor: t.color }}></div>
              <Wand2 size={24} className="text-zinc-600 group-hover:text-brand mb-2" />
              <span className="relative z-10 text-[9px] font-black uppercase text-zinc-400 group-hover:text-white">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* QUICK ADD */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Eigene Elemente hinzufügen</label>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => addElement('text')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-black/40 border border-white/5 hover:border-brand transition-all text-zinc-500 hover:text-brand group"> <Plus size={16} className="group-hover:scale-110 transition-transform"/> <span className="text-[8px] font-black uppercase">Text</span> </button>
          <button onClick={() => addElement('rect')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-black/40 border border-white/5 hover:border-brand transition-all text-zinc-500 hover:text-brand group"> <div className="w-4 h-4 border-2 border-current rounded-sm group-hover:scale-110 transition-transform"/> <span className="text-[8px] font-black uppercase">Viereck</span> </button>
          <button onClick={() => addElement('circle')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-black/40 border border-white/5 hover:border-brand transition-all text-zinc-500 hover:text-brand group"> <div className="w-4 h-4 border-2 border-current rounded-full group-hover:scale-110 transition-transform"/> <span className="text-[8px] font-black uppercase">Kreis</span> </button>
        </div>
      </div>

      {/* FONTS */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Globale Schriftart</label>
        <Select value={settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value })} options={FONTS} />
      </div>

      {/* FILTERS */}
      <div className="space-y-6">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Filter & Effekte</label>
        {[
          { label: 'Blur', key: 'blur', min: 0, max: 20, step: 1, unit: 'px' },
          { label: 'Helligkeit', key: 'brightness', min: 0, max: 2, step: 0.1, unit: '%' },
          { label: 'Graustufen', key: 'grayscale', min: 0, max: 1, step: 0.1, unit: '%' }
        ].map(f => (
          <div key={f.key} className="space-y-4 px-2">
            <div className="flex justify-between items-center"> 
              <span className="text-[9px] font-bold text-zinc-400 uppercase">{f.label}</span> 
              <span className="text-brand text-[9px]">{f.key === 'blur' ? (settings.filters?.[f.key] || 0) : Math.round((settings.filters?.[f.key] ?? 1) * 100)}{f.unit}</span> 
            </div>
            <input type="range" min={f.min} max={f.max} step={f.step} value={settings.filters?.[f.key] ?? (f.key === 'brightness' ? 1 : 0)} onChange={(e) => updateSettings({ filters: { ...settings.filters, [f.key]: parseFloat(e.target.value) } })} className="w-full accent-brand h-1" />
          </div>
        ))}
      </div>

      {/* ASSETS */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Bilder & Logos</label>
        <div className="grid grid-cols-2 gap-3">
          <label className="aspect-square rounded-2xl border-2 border-white/5 bg-black/40 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-brand/40 cursor-pointer transition-all relative overflow-hidden group">
            {settings.backgroundImage ? <img src={settings.backgroundImage} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-10 transition-opacity" /> : null}
            <ImageIcon size={24} className="relative z-10" /> <span className="text-[8px] font-black uppercase relative z-10">Hintergrund</span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (re) => updateSettings({ backgroundImage: re.target.result }); reader.readAsDataURL(file); } }} />
          </label>
          <label className="aspect-square rounded-2xl border-2 border-white/5 bg-black/40 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-brand/40 cursor-pointer transition-all relative overflow-hidden group">
            {settings.teamLogo ? <img src={settings.teamLogo} className="absolute inset-0 w-full h-full object-contain p-4 opacity-50 group-hover:opacity-20 transition-opacity" /> : null}
            <Upload size={24} className="relative z-10" /> <span className="text-[8px] font-black uppercase relative z-10">Logo</span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (re) => updateSettings({ teamLogo: re.target.result }); reader.readAsDataURL(file); } }} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default DesignTab;
