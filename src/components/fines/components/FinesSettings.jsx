import React from 'react';
import { motion } from 'framer-motion';
import { Euro, Users } from 'lucide-react';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

const FinesSettings = ({ 
  settings, 
  roster, 
  updateSettings 
}) => {
  return (
    <motion.div 
      key="settings" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="grid grid-cols-1 lg:grid-cols-2 gap-12"
    >
      <Card className="p-8" title="Monatsbeiträge" icon={Euro}>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand/10 rounded-2xl text-brand"><Euro size={24} /></div>
              <div>
                <h4 className="text-xs font-black uppercase text-zinc-100 italic">Automatischer Einzug</h4>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Erstellt jeden 1. des Monats Beiträge</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.enabled} 
              onChange={(e) => updateSettings({ enabled: e.target.checked })} 
              className="w-6 h-6 accent-brand rounded-lg" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Standard (€)" 
              type="number" 
              value={settings.amountStandard} 
              onChange={(e) => updateSettings({ amountStandard: parseFloat(e.target.value) || 0 })} 
            />
            <Input 
              label="Ermäßigt (€)" 
              type="number" 
              value={settings.amountReduced} 
              onChange={(e) => updateSettings({ amountReduced: parseFloat(e.target.value) || 0 })} 
            />
          </div>
        </div>
      </Card>

      <Card className="p-8" title="Spieler Status" icon={Users}>
        <div className="space-y-3">
          {roster.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/20 border border-zinc-800/50">
              <span className="text-[11px] font-black text-zinc-100 uppercase italic">{p.name}</span>
              <Select 
                className="w-32"
                value={settings.playerStatus?.[p.name] || 'standard'} 
                onChange={(e) => { 
                  const newStatus = { ...settings.playerStatus, [p.name]: e.target.value }; 
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
