import React, { useState, useRef, useEffect } from 'react';
import { Download, Edit3, Move, Maximize, RotateCw, Image as ImageIcon, Type, Trash2, X, Check, Save, Share2, Layers, AlignLeft, Layout, MousePointer2, Bold, Type as TypeIcon, Upload } from 'lucide-react';
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

const ResultImageEditor = ({ gameData, onClose }) => {
  const { 
    canvasRef, settings, updatePosition, updateSettings, setIsEditMode, isEditMode,
    setSelectedElement, selectedElement, currentBoxes, previewMode, setPreviewMode, generateCaption
  } = useResultImage(gameData);

  const [activeTab, setActiveTab] = useState('design');
  const [dragState, setDragState] = useState({ isDragging: false, action: null, startX: 0, startY: 0, originalSettings: null });

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
        const localX = b.cx + dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = b.cy + dx * Math.sin(rad) + dy * Math.cos(rad);
        const realW = b.w * b.scale; const realH = b.h * b.scale;
        const rx = b.cx - realW / 2; const ry = b.cy - realH / 2;
        const s = 30; 
        if (Math.abs(localX - b.cx) < s && Math.abs(localY - (ry - 35)) < s) { found = b.key; action = 'rotate'; }
        else if (Math.abs(localX - (rx + realW)) < s && Math.abs(localY - (ry + realH)) < s) { found = b.key; action = 'scale'; }
      }
    }

    if (!found) {
      for (let i = currentBoxes.length - 1; i >= 0; i--) {
        const b = currentBoxes[i];
        if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
          found = b.key; action = 'move'; break;
        }
      }
    }

    setSelectedElement(found);
    if (found) {
      setDragState({ isDragging: true, action, startX: pos.x, startY: pos.y, originalSettings: { ...settings.positions[found] } });
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!dragState.isDragging || !selectedElement) {
      if (isEditMode) {
        const pos = getMousePos(e);
        let cursor = 'default';
        if (selectedElement) {
          const b = currentBoxes.find(box => box.key === selectedElement);
          if (b) {
            const rad = -(b.rotation || 0) * Math.PI / 180;
            const dx = pos.x - b.cx; const dy = pos.y - b.cy;
            const lx = b.cx + dx * Math.cos(rad) - dy * Math.sin(rad);
            const ly = b.cy + dx * Math.sin(rad) + dy * Math.cos(rad);
            const s = 30;
            if (Math.abs(lx - b.cx) < s && Math.abs(ly - (b.cy - (b.h*b.scale/2) - 35)) < s) cursor = 'crosshair';
            else if (Math.abs(lx - (b.cx + b.w*b.scale/2)) < s && Math.abs(ly - (b.cy + b.h*b.scale/2)) < s) cursor = 'nwse-resize';
          }
        }
        if (cursor === 'default') {
          for (const b of currentBoxes) {
            if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) { cursor = 'grab'; break; }
          }
        }
        canvas.style.cursor = cursor;
      }
      return;
    }

    const pos = getMousePos(e);
    const box = currentBoxes.find(b => b.key === selectedElement);
    if (!box) return;

    if (dragState.action === 'move') {
      const dx = pos.x - dragState.startX; const dy = pos.y - dragState.startY;
      updatePosition(selectedElement, {
        x: Math.round((dragState.originalSettings.x + dx) / 5) * 5,
        y: Math.round((dragState.originalSettings.y + dy) / 5) * 5
      });
    } else if (dragState.action === 'scale') {
      const d = Math.hypot(pos.x - box.cx, pos.y - box.cy) / Math.hypot(dragState.startX - box.cx, dragState.startY - box.cy);
      updatePosition(selectedElement, { scale: Math.max(0.1, dragState.originalSettings.scale * d) });
    } else if (dragState.action === 'rotate') {
      const angle = (Math.atan2(pos.y - box.cy, pos.x - box.cx) - Math.atan2(dragState.startY - box.cy, dragState.startX - box.cx)) * 180 / Math.PI;
      let rot = dragState.originalSettings.rotation + angle;
      const snapPoints = [0, 90, 180, 270, 360, -90, -180, -270];
      for (const sp of snapPoints) { if (Math.abs(rot - sp) < 8) { rot = sp; break; } }
      if (e.shiftKey) rot = Math.round(rot / 45) * 45;
      updatePosition(selectedElement, { rotation: Math.round(rot) });
    }
  };

  const getElementLabel = (key) => {
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
            <Button 
              onClick={() => setIsEditMode(!isEditMode)} 
              variant={isEditMode ? "brand" : "ghost"}
              className="px-6 py-3 text-[10px] uppercase font-black backdrop-blur-xl"
            >
              {isEditMode ? <><Check size={16} strokeWidth={3} className="mr-2" /> Fertig</> : <><Edit3 size={16} className="mr-2" /> Layout bearbeiten</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full md:w-[450px] bg-zinc-900/80 border-l border-white/5 flex flex-col overflow-hidden shadow-[-40px_0_80px_rgba(0,0,0,0.5)]">
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="text-2xl font-black text-zinc-100 uppercase italic">Studio</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">v6.0 - Premium Edition</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all"><X size={20} /></button>
        </div>

        <div className="flex p-2 bg-black/40 gap-1">
          {[
            { id: 'design', label: 'Design', icon: Layers },
            { id: 'elements', label: 'Elemente', icon: Type },
            { id: 'preview', label: 'Vorschau', icon: Layout }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-300'}`} >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {activeTab === 'design' && (
            <div className="space-y-8 animate-in slide-in-from-left-4">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Globale Schriftart</label>
                <Select 
                  value={settings.fontFamily} 
                  onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                  options={FONTS}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Dunkelheit (Overlay)</label>
                  <span className="text-[10px] font-black text-brand">{(settings.overlayOpacity * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={settings.overlayOpacity} onChange={(e) => updateSettings({ overlayOpacity: parseFloat(e.target.value) })} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-brand" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Assets (Bilder & Logos)</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Background Upload */}
                  <label className="aspect-square rounded-2xl border-2 border-white/5 bg-black/40 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-brand/40 cursor-pointer transition-all relative overflow-hidden group">
                    {settings.backgroundImage ? (
                      <img src={settings.backgroundImage} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-10 transition-opacity" />
                    ) : null}
                    <ImageIcon size={24} className="relative z-10" />
                    <span className="text-[8px] font-black uppercase relative z-10">Hintergrund</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (re) => updateSettings({ backgroundImage: re.target.result }); reader.readAsDataURL(file); } }} />
                  </label>

                  {/* Logo Upload */}
                  <label className="aspect-square rounded-2xl border-2 border-white/5 bg-black/40 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-brand/40 cursor-pointer transition-all relative overflow-hidden group">
                    {settings.teamLogo ? (
                      <img src={settings.teamLogo} className="absolute inset-0 w-full h-full object-contain p-4 opacity-50 group-hover:opacity-20 transition-opacity" />
                    ) : null}
                    <Upload size={24} className="relative z-10" />
                    <span className="text-[8px] font-black uppercase relative z-10">Vereinslogo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (re) => updateSettings({ teamLogo: re.target.result }); reader.readAsDataURL(file); } }} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Eigene Farbe</label>
                  <input type="color" value={settings.ownTeamColor} onChange={(e) => updateSettings({ ownTeamColor: e.target.value })} className="w-full h-12 bg-black/40 border border-white/10 rounded-2xl cursor-pointer" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Gegner Farbe</label>
                  <input type="color" value={settings.opponentColor} onChange={(e) => updateSettings({ opponentColor: e.target.value })} className="w-full h-12 bg-black/40 border border-white/10 rounded-2xl cursor-pointer" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Instagram Hashtags</label>
                <textarea 
                  value={settings.hashtags} 
                  onChange={(e) => updateSettings({ hashtags: e.target.value })}
                  placeholder="#handball #matchday..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-zinc-100 outline-none focus:border-brand h-24 resize-none no-scrollbar"
                />
              </div>
            </div>
          )}

          {activeTab === 'elements' && (
            <div className="space-y-6">
              {selectedElement ? (
                <div className="p-6 rounded-3xl bg-brand/10 border border-brand/20 space-y-6 animate-in slide-in-from-right-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-brand uppercase italic">{getElementLabel(selectedElement)}</p>
                    <button onClick={() => setSelectedElement(null)}><X size={14} className="text-brand" /></button>
                  </div>

                  {selectedElement === 'separatorLine' ? (
                    <div className="space-y-4">
                      <div className="space-y-2"> <label className="text-[8px] font-black text-zinc-500 uppercase">Länge</label> <input type="range" min="100" max="1000" value={settings.positions.separatorLine.width} onChange={(e) => updatePosition('separatorLine', { width: parseInt(e.target.value) })} className="w-full accent-brand" /> </div>
                      <div className="space-y-2"> <label className="text-[8px] font-black text-zinc-500 uppercase">Dicke</label> <input type="range" min="1" max="10" value={settings.positions.separatorLine.thickness} onChange={(e) => updatePosition('separatorLine', { thickness: parseInt(e.target.value) })} className="w-full accent-brand" /> </div>
                    </div>
                  ) : selectedElement === 'logo' ? (
                    <div className="p-4 text-center">
                      <p className="text-[10px] font-medium text-zinc-400 leading-relaxed italic">Das Logo kannst du im "Design" Tab hochladen. Hier kannst du es nur verschieben oder skalieren.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-zinc-500 uppercase flex items-center gap-2"><TypeIcon size={10}/> Größe</label>
                          <Input 
                            type="number" 
                            value={settings.positions[selectedElement].fontSize} 
                            onChange={(e) => updatePosition(selectedElement, { fontSize: parseInt(e.target.value) || 20 })} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-zinc-500 uppercase flex items-center gap-2"><Bold size={10}/> Stil</label>
                          <Button 
                            variant={settings.positions[selectedElement].bold ? "brand" : "ghost"}
                            className="w-full py-2 text-[10px]"
                            onClick={() => updatePosition(selectedElement, { bold: !settings.positions[selectedElement].bold })}
                          >
                            Fett
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-zinc-500 uppercase">Individuelle Schriftart</label>
                        <Select 
                          value={settings.positions[selectedElement].fontFamily || ''} 
                          onChange={(e) => updatePosition(selectedElement, { fontFamily: e.target.value })}
                          options={[{ value: '', label: 'Globale Schriftart nutzen' }, ...FONTS]}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto text-zinc-600"><MousePointer2 size={32} /></div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed">Klicke ein Element auf dem Bild an, um es hier zu bearbeiten.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Ergebnis simulieren</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'win', label: 'Heimsieg', color: 'bg-brand text-black shadow-lg shadow-brand/20' },
                    { id: 'away_win', label: 'Auswärtssieg', color: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' },
                    { id: 'loss', label: 'Niederlage', color: 'bg-red-500 text-white shadow-lg shadow-red-500/20' },
                    { id: 'draw', label: 'Unentschieden', color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' }
                  ].map(p => (
                    <button key={p.id} onClick={() => setPreviewMode(p.id)} className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all ${previewMode === p.id ? p.color : 'bg-zinc-900 text-zinc-500 hover:text-white'}`} > {p.label} </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-black/40">
          <Button variant="ghost" className="w-full py-4 text-[10px]" onClick={onClose}>Studio Verlassen</Button>
        </div>
      </div>
    </div>
  );
};

export default ResultImageEditor;
