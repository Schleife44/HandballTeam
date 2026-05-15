import React from 'react';
import { motion } from 'framer-motion';
import { Euro, Users, Send } from 'lucide-react';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Button from '../../ui/Button';

const FinesSettings = ({ 
  settings, 
  roster, 
  updateSettings,
  onRequestMonthly 
}) => {
  return (
    <motion.div 
      key="settings" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-8 items-start"
    >
      <div className="space-y-8">
        <Card className="p-6" title="Beitrags-Steuerung" icon={Euro}>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand/10 rounded-xl text-brand"><Euro size={20} /></div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-zinc-100 italic leading-none">Automatischer Einzug</h4>
                  <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1.5">Jeden 1. des Monats</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.enabled} 
                onChange={(e) => updateSettings({ enabled: e.target.checked })} 
                className="w-5 h-5 accent-brand rounded-lg" 
              />
            </div>

            {!settings.enabled && (
              <Button 
                variant="brandGhost" 
                size="md" 
                className="w-full py-4 text-[9px]"
                onClick={onRequestMonthly}
                icon={Send}
              >
                Monatsbeitrag einfordern
              </Button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Standard (€)" 
                type="number" 
                className="text-xs"
                value={settings.amountStandard} 
                onChange={(e) => updateSettings({ amountStandard: parseFloat(e.target.value) || 0 })} 
              />
              <Input 
                label="Ermäßigt (€)" 
                type="number" 
                className="text-xs"
                value={settings.amountReduced} 
                onChange={(e) => updateSettings({ amountReduced: parseFloat(e.target.value) || 0 })} 
              />
            </div>
          </div>
        </Card>

        <div className="p-4 rounded-3xl bg-zinc-900/20 border border-zinc-800/40">
           <p className="text-[9px] font-bold text-zinc-600 uppercase leading-relaxed text-center italic">
             Hinweis: Manuelle Forderungen können nur einmal pro Monat ausgelöst werden.
           </p>
        </div>
      </div>

      <Card className="p-6 h-full" title="Mitglieder Status" icon={Users}>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {roster.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/20 border border-zinc-800/40 hover:bg-zinc-900/40 transition-all">
              <span className="text-[10px] font-black text-zinc-100 uppercase italic truncate max-w-[180px]">{p.name}</span>
              <Select 
                className="w-28 text-[9px] h-9"
                value={settings.playerStatus?.[p.name.trim()] || 'standard'} 
                onChange={(e) => { 
                  const playerName = p.name.trim();
                  const newStatus = { ...settings.playerStatus, [playerName]: e.target.value }; 
                  updateSettings({ playerStatus: newStatus }); 
                }}
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'reduced', label: 'Ermäßigt' },
                  { value: 'excluded', label: 'Befreit' }
                ]}
              />
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default FinesSettings;
