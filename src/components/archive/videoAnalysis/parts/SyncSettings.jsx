import React from 'react';
import { Settings2, Clock, CheckCircle, Globe } from 'lucide-react';
import Button from '../../../ui/Button';
import { formatiereZeit, parseTime } from '../../../../utils/timeUtils';

const SyncSettings = ({
  videoOffsets,
  setHalfOffset,
  leadTime,
  setLeadTime,
  isEditingH1,
  setIsEditingH1,
  isEditingH2,
  setIsEditingH2,
  manualH1,
  setManualH1,
  manualH2,
  setManualH2,
  onManualSave,
  setIsSyncModalOpen,
  isFocusMode
}) => {
  return (
    <div className={`flex items-center gap-4 bg-zinc-900/60 backdrop-blur-md p-3 rounded-2xl border border-white/5 mt-4 transition-all ${isFocusMode ? 'scale-90 opacity-50 hover:opacity-100' : ''}`}>
      <div className="flex items-center gap-2 pr-4 border-r border-white/5">
        <Settings2 size={14} className="text-zinc-500" />
        <span className="text-[10px] font-black uppercase text-zinc-100 italic">Sync Engine</span>
      </div>

      <div className="flex items-center gap-6">
        {/* H1 Offset */}
        <div className="flex flex-col gap-1">
          <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Start H1</span>
          {isEditingH1 ? (
            <input 
              autoFocus
              value={manualH1}
              onChange={(e) => setManualH1(e.target.value)}
              onBlur={() => onManualSave(1, manualH1)}
              onKeyDown={(e) => e.key === 'Enter' && onManualSave(1, manualH1)}
              className="bg-brand/10 border border-brand/40 text-brand text-[10px] font-black w-16 px-2 py-0.5 rounded outline-none"
            />
          ) : (
            <div className="flex items-center gap-2 group">
              <span 
                onClick={() => { setManualH1(formatiereZeit(videoOffsets.h1)); setIsEditingH1(true); }}
                className="text-sm font-black text-zinc-100 tabular-nums cursor-pointer hover:text-brand"
              >
                {videoOffsets.h1 !== null ? formatiereZeit(videoOffsets.h1) : '--:--'}
              </span>
              <button onClick={() => setHalfOffset(1)} className="text-[8px] font-black text-brand uppercase hover:underline opacity-0 group-hover:opacity-100 transition-all">Set Now</button>
            </div>
          )}
        </div>

        {/* H2 Offset */}
        <div className="flex flex-col gap-1">
          <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Start H2</span>
          {isEditingH2 ? (
            <input 
              autoFocus
              value={manualH2}
              onChange={(e) => setManualH2(e.target.value)}
              onBlur={() => onManualSave(2, manualH2)}
              onKeyDown={(e) => e.key === 'Enter' && onManualSave(2, manualH2)}
              className="bg-brand/10 border border-brand/40 text-brand text-[10px] font-black w-16 px-2 py-0.5 rounded outline-none"
            />
          ) : (
            <div className="flex items-center gap-2 group">
              <span 
                onClick={() => { setManualH2(formatiereZeit(videoOffsets.h2)); setIsEditingH2(true); }}
                className="text-sm font-black text-zinc-100 tabular-nums cursor-pointer hover:text-brand"
              >
                {videoOffsets.h2 !== null ? formatiereZeit(videoOffsets.h2) : '--:--'}
              </span>
              <button onClick={() => setHalfOffset(2)} className="text-[8px] font-black text-brand uppercase hover:underline opacity-0 group-hover:opacity-100 transition-all">Set Now</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          icon={Globe} 
          onClick={() => setIsSyncModalOpen(true)}
          className="text-[9px] h-9"
        >
          Handball.net Sync
        </Button>
      </div>
    </div>
  );
};

export default SyncSettings;
