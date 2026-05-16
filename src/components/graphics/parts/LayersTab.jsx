import React from 'react';
import { Type as TypeIcon, Layers, Trash2, X, Plus, Layout } from 'lucide-react';
import Badge from '../../ui/Badge';
import Input from '../../ui/Input';

const LayersTab = ({ settings, selectedElement, setSelectedElement, removeElement, updatePosition }) => {
  const getElementLabel = (key) => {
    if (key.startsWith('custom_text_')) return 'Eigener Text';
    if (key.startsWith('custom_rect_')) return 'Viereck';
    if (key.startsWith('custom_circle_')) return 'Kreis';
    const labels = {
      ergebnisLabel: 'Ergebnis (Vertikal)',
      seasonLabel: 'Saison (Vertikal)',
      statusGroup: 'Sieg/Niederlage Text',
      dateLabel: 'Spieldatum',
      vsLabel: 'VS. Label',
      ourScore: 'Eigener Spielstand',
      theirScore: 'Gegner Spielstand',
      teamLabel: 'Mannschafts-Label',
      separatorLine: 'Design Linie',
      logo: 'Team Logo'
    };
    return labels[key] || key;
  };

  const customElement = selectedElement?.startsWith('custom_') ? (settings.elements || []).find(el => el.id === selectedElement) : null;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Ebenen-Übersicht</label>
        <div className="space-y-1 bg-black/20 rounded-2xl p-2 border border-white/5">
          {(settings.elements || []).map(el => (
            <button key={el.id} onClick={() => setSelectedElement(el.id)} className={`w-full p-3 rounded-xl flex items-center justify-between text-[10px] font-black uppercase italic transition-all ${selectedElement === el.id ? 'bg-brand text-black' : 'text-zinc-500 hover:bg-zinc-800'}`}>
              <div className="flex items-center gap-3"> {el.type === 'text' ? <TypeIcon size={12}/> : <Layers size={12}/>} {el.type === 'text' ? el.content.substring(0, 15) : getElementLabel(el.id)} </div>
              <div onClick={(e) => { e.stopPropagation(); removeElement(el.id); }} className="p-1 hover:bg-black/20 rounded"><Trash2 size={12}/></div>
            </button>
          ))}
          {Object.keys(settings.positions).map(key => (
            <button key={key} onClick={() => setSelectedElement(key)} className={`w-full p-3 rounded-xl flex items-center text-[10px] font-black uppercase italic transition-all ${selectedElement === key ? 'bg-brand text-black' : 'text-zinc-500 hover:bg-zinc-800'}`}>
              <Layers size={12} className="mr-3"/> {getElementLabel(key)}
            </button>
          ))}
        </div>
      </div>

      {selectedElement && (
        <div className="p-6 rounded-[2rem] bg-zinc-950 border border-white/5 space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between">
            <Badge variant="brand" className="text-[8px] uppercase">{getElementLabel(selectedElement)}</Badge>
            <button onClick={() => setSelectedElement(null)}><X size={14} className="text-zinc-600" /></button>
          </div>
          {customElement?.type === 'text' && (
            <textarea value={customElement.content} onChange={(e) => updatePosition(selectedElement, { content: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-brand h-20 resize-none" />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"> <label className="text-[8px] font-black text-zinc-600 uppercase">Farbe</label> <input type="color" value={customElement?.color || '#ffffff'} onChange={(e) => updatePosition(selectedElement, { color: e.target.value })} className="w-full h-10 bg-black rounded-lg border border-white/10" /> </div>
            <div className="space-y-2"> <label className="text-[8px] font-black text-zinc-600 uppercase">Größe</label> <Input type="number" value={customElement?.fontSize || settings.positions[selectedElement]?.fontSize || 0} onChange={(e) => updatePosition(selectedElement, { fontSize: parseInt(e.target.value) })} className="h-10" /> </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayersTab;
