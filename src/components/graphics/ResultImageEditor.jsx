import React, { useState, useRef, useEffect } from 'react';
import { Download, Edit3, Move, Maximize, RotateCw, Image as ImageIcon, Type, Trash2, X, Check, Save, Share2, Layers, AlignLeft, Layout, MousePointer2, Bold, Type as TypeIcon, Upload, ArrowUp, ArrowDown, Wand2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResultImage } from '../../hooks/useResultImage';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';

const FONTS = [
  { value: 'Oswald', label: 'Oswald (Sport)' },
  { value: 'Bebas Neue', label: 'Bebas (Impact)' },
  { value: 'Teko', label: 'Teko (Condensed)' },
  { value: 'Racing Sans One', label: 'Racing (Speed)' },
  { value: 'Montserrat', label: 'Montserrat (Modern)' },
  { value: 'Outfit', label: 'Outfit (Sleek)' },
  { value: 'Inter', label: 'Inter (Clean)' }
];

const TEMPLATES = [
  { id: 'toxic_neon', label: 'Toxic Neon', color: '#84cc16' },
  { id: 'deep_red', label: 'Deep Aggressive', color: '#ef4444' },
  { id: 'clean_pro', label: 'Clean Pro', color: '#3b82f6' },
  { id: 'custom_blank', label: 'Eigene Vorlage', color: '#a1a1aa' }
];

const ResultImageEditor = ({ gameData, onClose }) => {
  const { 
    canvasRef, settings, updatePosition, updateSettings, setIsEditMode, isEditMode,
    setSelectedElement, selectedElement, currentBoxes, previewMode, setPreviewMode,
    addElement, removeElement, applyTemplate, generateCaption
  } = useResultImage(gameData);

  const [activeTab, setActiveTab] = useState('design');
  const [dragState, setDragState] = useState({ isDragging: false, action: null, startX: 0, startY: 0, originalSettings: null });
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveDesign = () => {
    // Falls hier noch eine Cloud-Sync nötig wäre, passiert das bereits automatisch über useResultImage / updateSettings
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  useEffect(() => {
    setIsEditMode(true);
    return () => setIsEditMode(false);
  }, [setIsEditMode]);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e) => {
    if (!isEditMode) return;
    const pos = getMousePos(e);
    let action = 'move';
    let found = null;

    if (selectedElement) {
      const b = currentBoxes.find(box => box.key === selectedElement);
      if (b) {
        const rad = -(b.rotation || 0) * Math.PI / 180;
        const dx = pos.x - b.cx; const dy = pos.y - b.cy;
        const lx = b.cx + dx * Math.cos(rad) - dy * Math.sin(rad);
        const ly = b.cy + dx * Math.sin(rad) + dy * Math.cos(rad);
        const s = 40;
        if (Math.abs(lx - b.cx) < s && Math.abs(ly - (b.cy - (b.h*b.scale/2) - 40)) < s) { found = b.key; action = 'rotate'; }
        else if (Math.abs(lx - (b.cx + b.w*b.scale/2)) < s && Math.abs(ly - (b.cy + b.h*b.scale/2)) < s) { found = b.key; action = 'scale'; }
      }
    }

    if (!found) {
      for (let i = currentBoxes.length - 1; i >= 0; i--) {
        const b = currentBoxes[i];
        if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) { found = b.key; action = 'move'; break; }
      }
    }

    setSelectedElement(found);
    if (found) {
      const element = found.startsWith('custom_') ? (settings.elements || []).find(el => el.id === found) : settings.positions[found];
      setDragState({ isDragging: true, action, startX: pos.x, startY: pos.y, originalSettings: { ...element } });
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current; if (!canvas) return;
    if (!dragState.isDragging || !selectedElement) {
      if (isEditMode) {
        const pos = getMousePos(e); let cursor = 'default';
        if (selectedElement) {
          const b = currentBoxes.find(box => box.key === selectedElement);
          if (b) {
            const rad = -(b.rotation || 0) * Math.PI / 180; const dx = pos.x - b.cx; const dy = pos.y - b.cy;
            const lx = b.cx + dx * Math.cos(rad) - dy * Math.sin(rad); const ly = b.cy + dx * Math.sin(rad) + dy * Math.cos(rad);
            const s = 40;
            if (Math.abs(lx - b.cx) < s && Math.abs(ly - (b.cy - (b.h*b.scale/2) - 40)) < s) cursor = 'crosshair';
            else if (Math.abs(lx - (b.cx + b.w*b.scale/2)) < s && Math.abs(ly - (b.cy + b.h*b.scale/2)) < s) cursor = 'nwse-resize';
          }
        }
        if (cursor === 'default') {
          for (const b of currentBoxes) { if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) { cursor = 'grab'; break; } }
        }
        canvas.style.cursor = cursor;
      }
      return;
    }
    const pos = getMousePos(e); const box = currentBoxes.find(b => b.key === selectedElement); if (!box) return;

    if (dragState.action === 'move') {
      const dx = pos.x - dragState.startX; const dy = pos.y - dragState.startY;
      updatePosition(selectedElement, { x: Math.round((dragState.originalSettings.x + dx) / 5) * 5, y: Math.round((dragState.originalSettings.y + dy) / 5) * 5 });
    } else if (dragState.action === 'scale') {
      const d = Math.hypot(pos.x - box.cx, pos.y - box.cy) / Math.hypot(dragState.startX - box.cx, dragState.startY - box.cy);
      updatePosition(selectedElement, { scale: Math.max(0.1, dragState.originalSettings.scale * d) });
    } else if (dragState.action === 'rotate') {
      const angle = (Math.atan2(pos.y - box.cy, pos.x - box.cx) - Math.atan2(dragState.startY - box.cy, dragState.startX - box.cx)) * 180 / Math.PI;
      let rot = (dragState.originalSettings.rotation || 0) + angle;
      if (e.shiftKey) rot = Math.round(rot / 45) * 45;
      updatePosition(selectedElement, { rotation: Math.round(rot) });
    }
  };

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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-500">
      
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950/50 relative">
        <div className="relative group shadow-2xl shadow-black/50">
          <canvas 
            ref={canvasRef}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={() => setDragState({ isDragging: false, action: null, startX: 0, startY: 0, originalSettings: null })}
            onMouseLeave={() => setDragState({ isDragging: false, action: null, startX: 0, startY: 0, originalSettings: null })}
            className={`max-h-[85vh] aspect-square bg-zinc-900 rounded-lg shadow-2xl transition-all ${isEditMode ? 'cursor-grab ring-2 ring-brand/30' : 'cursor-default'}`}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button onClick={() => setIsEditMode(!isEditMode)} variant={isEditMode ? "brand" : "ghost"} className="px-6 py-3 text-[10px] uppercase font-black backdrop-blur-xl">
              {isEditMode ? <><Check size={16} strokeWidth={3} className="mr-2" /> Fertig</> : <><Edit3 size={16} className="mr-2" /> Layout bearbeiten</>}
            </Button>
          </div>
          
          {selectedElement && isEditMode && (
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex gap-2 animate-in slide-in-from-bottom-2">
              <button onClick={() => updatePosition(selectedElement, { x: 540 })} className="p-3 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-[8px] font-black uppercase"><AlignLeft size={14} className="rotate-90"/> X-Mitte</button>
              <button onClick={() => updatePosition(selectedElement, { y: 540 })} className="p-3 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-[8px] font-black uppercase"><AlignLeft size={14}/> Y-Mitte</button>
              {selectedElement.startsWith('custom_') && (
                <button onClick={() => removeElement(selectedElement)} className="p-3 hover:bg-red-500/20 rounded-xl text-red-500 transition-all"><Trash2 size={14}/></button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-[450px] bg-zinc-900/80 border-l border-white/5 flex flex-col overflow-hidden shadow-[-40px_0_80px_rgba(0,0,0,0.5)]">
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="text-2xl font-black text-zinc-100 uppercase italic">Studio</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">v6.5 - Advanced Classic</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all"><X size={20} /></button>
        </div>

        <div className="flex p-2 bg-black/40 gap-1">
          {[
            { id: 'design', label: 'Design', icon: Layers },
            { id: 'elements', label: 'Ebenen', icon: TypeIcon },
            { id: 'preview', label: 'Vorschau', icon: Layout }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-300'}`} >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
          {activeTab === 'design' && (
            <div className="space-y-10 animate-in slide-in-from-left-4">
              {/* PRESETS SECTION */}
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

              {/* ADD CUSTOM ELEMENTS QUICK BAR */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Eigene Elemente hinzufügen</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => addElement('text')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-black/40 border border-white/5 hover:border-brand transition-all text-zinc-500 hover:text-brand group"> <Plus size={16} className="group-hover:scale-110 transition-transform"/> <span className="text-[8px] font-black uppercase">Text</span> </button>
                  <button onClick={() => addElement('rect')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-black/40 border border-white/5 hover:border-brand transition-all text-zinc-500 hover:text-brand group"> <div className="w-4 h-4 border-2 border-current rounded-sm group-hover:scale-110 transition-transform"/> <span className="text-[8px] font-black uppercase">Viereck</span> </button>
                  <button onClick={() => addElement('circle')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-black/40 border border-white/5 hover:border-brand transition-all text-zinc-500 hover:text-brand group"> <div className="w-4 h-4 border-2 border-current rounded-full group-hover:scale-110 transition-transform"/> <span className="text-[8px] font-black uppercase">Kreis</span> </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Globale Schriftart</label>
                <Select value={settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value })} options={FONTS} />
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Filter & Effekte</label>
                {[
                  { label: 'Blur', key: 'blur', min: 0, max: 20, step: 1, unit: 'px' },
                  { label: 'Helligkeit', key: 'brightness', min: 0, max: 2, step: 0.1, unit: '%' },
                  { label: 'Graustufen', key: 'grayscale', min: 0, max: 1, step: 0.1, unit: '%' }
                ].map(f => (
                  <div key={f.key} className="space-y-4 px-2">
                    <div className="flex justify-between items-center"> <span className="text-[9px] font-bold text-zinc-400 uppercase">{f.label}</span> <span className="text-brand text-[9px]">{f.key === 'blur' ? (settings.filters?.[f.key] || 0) : Math.round((settings.filters?.[f.key] ?? 1) * 100)}{f.unit}</span> </div>
                    <input type="range" min={f.min} max={f.max} step={f.step} value={settings.filters?.[f.key] ?? (f.key === 'brightness' ? 1 : 0)} onChange={(e) => updateSettings({ filters: { ...settings.filters, [f.key]: parseFloat(e.target.value) } })} className="w-full accent-brand h-1" />
                  </div>
                ))}
              </div>

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
          )}

          {activeTab === 'elements' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              {/* ADD ELEMENTS QUICK BAR */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => addElement('text')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-brand transition-all text-zinc-500 hover:text-brand"> <Plus size={16}/> <span className="text-[8px] font-black uppercase">Text</span> </button>
                <button onClick={() => addElement('rect')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-brand transition-all text-zinc-500 hover:text-brand"> <Layout size={16}/> <span className="text-[8px] font-black uppercase">Viereck</span> </button>
                <button onClick={() => addElement('circle')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-brand transition-all text-zinc-500 hover:text-brand"> <Layers size={16}/> <span className="text-[8px] font-black uppercase">Kreis</span> </button>
              </div>

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
          )}

          {activeTab === 'preview' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 flex items-center gap-2">
                  <Layout size={14} className="text-brand" /> Ergebnis-Simulation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
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

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 flex items-center gap-2">
                  <Type size={14} className="text-brand" /> Instagram Text
                </label>
                
                <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase">Zusätzliche Hashtags</label>
                    <Input 
                      placeholder="#deinverein #heimsieg..." 
                      value={settings.hashtags || ''} 
                      onChange={(e) => updateSettings({ hashtags: e.target.value })} 
                      className="mt-1 h-9 text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase">Torschützen anzeigen</label>
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
                      Text Kopieren
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={() => {
                  const link = document.createElement('a');
                  link.download = `sechsmeter-ergebnis-${Date.now()}.png`;
                  link.href = canvasRef.current.toDataURL('image/png', 1.0);
                  link.click();
                }} variant="brand" className="w-full py-6 rounded-[2rem] text-xs font-black uppercase italic tracking-widest shadow-2xl shadow-brand/20 group">
                  <Download size={18} className="mr-3 group-hover:bounce transition-transform" /> Bild Final Speichern
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-black/40 flex gap-4">
          <Button variant="ghost" className="flex-1 py-4 text-[10px]" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant={isSaved ? "outline" : "brand"} 
            className={`flex-1 py-4 text-[10px] shadow-xl ${isSaved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50' : 'shadow-brand/20'}`} 
            onClick={handleSaveDesign}
          >
            {isSaved ? <><Check size={16} className="mr-2"/> Gespeichert!</> : 'Design Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultImageEditor;
