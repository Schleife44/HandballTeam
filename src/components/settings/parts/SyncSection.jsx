import React from 'react';
import { MessageSquare, Check, RotateCcw, RefreshCw, Zap } from 'lucide-react';
import Button from '../../ui/Button';

const SyncSection = ({ 
  hnetUrl, 
  onUrlChange, 
  settings, 
  onUpdate, 
  onSync,
  onApplyToAll,
  isSyncing,
  isTrainer
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Handball.net Team-Link</label>
        <input 
          type="text" 
          placeholder="https://www.handball.net/mannschaften/..."
          value={hnetUrl || ''}
          onChange={(e) => onUrlChange(e.target.value)}
          disabled={!isTrainer}
          className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-black text-zinc-100 focus:border-brand outline-none transition-all"
        />
        <p className="text-[8px] font-bold text-zinc-600 uppercase px-2 leading-relaxed">
          Füge den Link zu deiner Mannschaft ein, um den Spielplan automatisch in deinen Kalender zu laden.
        </p>
      </div>

      <div className="bg-black/40 border border-zinc-800/50 rounded-3xl p-6 space-y-6">
        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Standard-Einstellungen für Spieltermine</h4>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare size={16} className="text-zinc-600" />
            <span className="text-xs font-bold text-zinc-300">Absagegrund Pflicht</span>
          </div>
          <input 
            type="checkbox" 
            checked={settings.absageGrundPflicht}
            onChange={(e) => onUpdate('absageGrundPflicht', e.target.checked)}
            disabled={!isTrainer}
            className="w-5 h-5 accent-brand rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Check size={18} className="text-zinc-600" />
            <span className="text-xs font-bold text-zinc-300">Autom. als "Dabei" eintragen</span>
          </div>
          <input 
            type="checkbox" 
            checked={settings.autoDabei}
            onChange={(e) => onUpdate('autoDabei', e.target.checked)}
            disabled={!isTrainer}
            className="w-5 h-5 accent-brand rounded"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RotateCcw size={16} className="text-zinc-600" />
            <span className="text-xs font-bold text-zinc-300">Absagen möglich bis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input 
                type="number" 
                min="0"
                value={Math.floor((settings.absageDeadline ?? 24) / 24)}
                onChange={(e) => {
                  const d = parseInt(e.target.value) || 0;
                  const h = (settings.absageDeadline ?? 24) % 24;
                  onUpdate('absageDeadline', d * 24 + h);
                }}
                disabled={!isTrainer}
                className="w-12 bg-black/60 border border-zinc-800 rounded-xl py-2 px-1 text-center text-xs font-black text-brand"
              />
              <span className="text-[8px] font-black uppercase text-zinc-700">Tage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input 
                type="number" 
                min="0" 
                max="23"
                value={(settings.absageDeadline ?? 24) % 24}
                onChange={(e) => {
                  const h = parseInt(e.target.value) || 0;
                  const d = Math.floor((settings.absageDeadline ?? 24) / 24);
                  onUpdate('absageDeadline', d * 24 + h);
                }}
                disabled={!isTrainer}
                className="w-12 bg-black/60 border border-zinc-800 rounded-xl py-2 px-1 text-center text-xs font-black text-brand"
              />
              <span className="text-[8px] font-black uppercase text-zinc-700">Std.</span>
            </div>
            <span className="text-[8px] font-bold text-zinc-600 uppercase ml-1">vorher</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-zinc-600" />
            <span className="text-xs font-bold text-zinc-300">Treffpunkt-Vorlauf</span>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              value={settings.defaultMeetingOffset ?? 60}
              onChange={(e) => onUpdate('defaultMeetingOffset', parseInt(e.target.value) || 0)}
              disabled={!isTrainer}
              className="w-16 bg-black/60 border border-zinc-800 rounded-xl py-2 px-3 text-center text-xs font-black text-brand"
            />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Min. vorher</span>
          </div>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4 justify-end">
      {isTrainer && (
        <>
          <Button 
            variant="primary"
            size="xl"
            onClick={onSync}
            disabled={isSyncing}
            isLoading={isSyncing}
            icon={RefreshCw}
            className="w-full"
          >
            Spielplan synchronisieren
          </Button>

          <Button 
            variant="outline"
            size="sm"
            onClick={onApplyToAll}
            className="w-full py-5 text-[10px] tracking-[0.2em]"
          >
            Diese Einstellungen auf alle Spiele anwenden
          </Button>
        </>
      )}
    </div>
  </div>
);

export default SyncSection;
