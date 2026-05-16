import React, { useState, useEffect } from 'react';
import { Edit3, X, Check, Layers, Layout, Type as TypeIcon, AlignLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useResultImage } from '../../hooks/useResultImage';
import { useImageEditorLogic } from './useImageEditorLogic';

// UI
import Button from '../ui/Button';
import { EDITOR_TABS } from './graphicsConstants';

// Tabs
import DesignTab from './parts/DesignTab';
import LayersTab from './parts/LayersTab';
import PreviewTab from './parts/PreviewTab';

const ResultImageEditor = ({ gameData, onClose }) => {
  const { 
    canvasRef, settings, updatePosition, updateSettings, setIsEditMode, isEditMode,
    setSelectedElement, selectedElement, currentBoxes, previewMode, setPreviewMode,
    addElement, removeElement, applyTemplate, generateCaption
  } = useResultImage(gameData);

  const [activeTab, setActiveTab] = useState('design');
  const [isSaved, setIsSaved] = useState(false);

  // Interaction Logic Hook
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useImageEditorLogic(
    canvasRef, isEditMode, selectedElement, setSelectedElement, currentBoxes, updatePosition, settings
  );

  const handleSaveDesign = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleFinalSave = () => {
    const link = document.createElement('a');
    link.download = `sechsmeter-ergebnis-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  };

  useEffect(() => {
    setIsEditMode(true);
    return () => setIsEditMode(false);
  }, [setIsEditMode]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-500">
      
      {/* CANVAS AREA */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950/50 relative">
        <div className="relative group shadow-2xl shadow-black/50">
          <canvas 
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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

      {/* SIDEBAR EDITOR */}
      <div className="w-full md:w-[450px] bg-zinc-900/80 border-l border-white/5 flex flex-col overflow-hidden shadow-[-40px_0_80px_rgba(0,0,0,0.5)]">
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="text-2xl font-black text-zinc-100 uppercase italic">Studio</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">v7.0 - Modular Engine</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all"><X size={20} /></button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex p-2 bg-black/40 gap-1">
          {EDITOR_TABS.map(tab => {
            const Icon = tab.id === 'design' ? Layers : tab.id === 'elements' ? TypeIcon : Layout;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-300'}`} >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'design' && (
              <DesignTab 
                key="design"
                settings={settings}
                applyTemplate={applyTemplate}
                addElement={addElement}
                updateSettings={updateSettings}
              />
            )}
            {activeTab === 'elements' && (
              <LayersTab 
                key="layers"
                settings={settings}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
                removeElement={removeElement}
                updatePosition={updatePosition}
              />
            )}
            {activeTab === 'preview' && (
              <PreviewTab 
                key="preview"
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
                settings={settings}
                updateSettings={updateSettings}
                generateCaption={generateCaption}
                onFinalSave={handleFinalSave}
              />
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER ACTIONS */}
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
