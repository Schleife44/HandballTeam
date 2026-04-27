import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Check, Edit3, MessageSquareText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResultImage } from '../../hooks/useResultImage';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const ResultPreviewModal = ({ gameData, onClose, onOpenEditor }) => {
  const { canvasRef, generateCaption } = useResultImage(gameData);
  const [copied, setCopied] = useState(false);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    // Small delay to ensure hooks are ready
    const timer = setTimeout(() => {
      setCaption(generateCaption());
    }, 100);
    return () => clearTimeout(timer);
  }, [generateCaption]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = `ergebnis_handball.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[150] flex items-center justify-center p-4 md:p-12 overflow-y-auto no-scrollbar">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-12"
      >
        
        {/* LEFT: CANVAS PREVIEW */}
        <div className="flex-1 space-y-6">
          <div className="relative group shadow-[0_50px_100px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden border border-white/5">
            <canvas 
              ref={canvasRef}
              className="w-full aspect-square bg-zinc-900 shadow-2xl"
            />
            
            {/* Download Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
               <button 
                onClick={downloadImage}
                className="p-6 bg-brand text-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-2xl"
               >
                 <Download size={32} strokeWidth={3} />
               </button>
            </div>
          </div>
        </div>

        {/* RIGHT: ACTIONS & TEXT PREVIEW */}
        <div className="w-full lg:w-[450px] space-y-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Vorschau</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 italic">Ready for Social Media</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400"><X size={24} /></button>
          </div>

          {/* TEXT PREVIEW BOX */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">
              <MessageSquareText size={14} /> Instagram Text
            </div>
            <Card className="relative group p-0 border-white/5 overflow-hidden">
              <textarea 
                readOnly
                value={caption}
                className="w-full h-[320px] bg-transparent p-8 text-sm font-medium text-zinc-300 leading-relaxed resize-none outline-none no-scrollbar"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 to-transparent pointer-events-none rounded-[2rem]" />
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={downloadImage}
              variant="brand"
              className="py-5 rounded-[1.5rem] text-[10px]"
            >
              <Download size={18} strokeWidth={3} className="mr-3" /> Bild speichern
            </Button>
            <Button 
              onClick={handleCopy}
              variant={copied ? "brand" : "ghost"}
              className={`py-5 rounded-[1.5rem] text-[10px] ${copied ? 'bg-emerald-500 border-emerald-500' : ''}`}
            >
              {copied ? <><Check size={18} strokeWidth={3} className="mr-3" /> Kopiert!</> : <><Share2 size={18} className="mr-3" /> Text kopieren</>}
            </Button>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
            <button 
              onClick={onOpenEditor}
              className="flex items-center justify-center gap-2 text-[10px] font-black text-zinc-500 uppercase hover:text-brand transition-all group"
            >
              <Edit3 size={14} className="group-hover:scale-110 transition-all" /> Doch im Studio bearbeiten
            </button>
            <p className="text-[9px] font-bold text-zinc-700 text-center uppercase tracking-wider leading-relaxed">
              Tipp: Klicke auf das Bild, um es sofort herunterzuladen.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultPreviewModal;
