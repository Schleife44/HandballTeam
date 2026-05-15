import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, CheckCircle, TrendingUp, TrendingDown, Euro, Users, AlertCircle, FileText } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { generateFinesPdf } from '../../../utils/finesPdfGenerator';

const DashStatCard = ({ label, value, icon: Icon, color }) => (
  <Card className="p-6 bg-zinc-900/40 border-zinc-800">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl bg-zinc-800/50 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{label}</p>
        <h3 className="text-2xl font-black text-white italic mt-0.5">{value}</h3>
      </div>
    </div>
  </Card>
);

const FinesDashboard = ({ stats, playerStats, roster, history, teamName, finesSettings, formatCurrency }) => {
  const topDebtors = [...playerStats]
    .filter(p => p.unpaidFine > 0)
    .sort((a, b) => b.unpaidFine - a.unpaidFine);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Kassen-Übersicht</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Echtzeit-Statistiken der Mannschaftskasse</p>
        </div>
        <Button 
          variant="primary" 
          icon={FileText}
          className="rounded-2xl"
          onClick={() => generateFinesPdf(teamName, roster, history, formatCurrency, finesSettings)}
        >
          PDF erstellen
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashStatCard label="Kassenstand (Ist)" value={formatCurrency(stats.totalBalance)} icon={Wallet} color="text-brand" />
        <DashStatCard label="Kassenstand (Soll)" value={formatCurrency(stats.totalSoll)} icon={Euro} color="text-brand" />
        <DashStatCard label="Sonst. Einnahmen" value={formatCurrency(stats.otherIncome)} icon={TrendingUp} color="text-blue-400" />
        <DashStatCard label="Ausgaben" value={formatCurrency(stats.expenses)} icon={TrendingDown} color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-2 p-8" title="Größte Außenstände" icon={AlertCircle}>
          <div className="space-y-4 mt-6">
            {topDebtors.length === 0 ? (
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest py-8 text-center border-2 border-dashed border-zinc-900 rounded-3xl">Alle Konten sind ausgeglichen.</p>
            ) : (
              topDebtors.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 hover:bg-zinc-900/40 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-400 italic">#{p.number || '--'}</div>
                    <span className="text-xs font-black text-zinc-100 uppercase italic tracking-tight">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-lg font-black text-red-500 italic">{formatCurrency(p.unpaidFine)}</div>
                      <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{p.count} offene Strafen</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-8 h-fit" title="Kassen-Status" icon={Users}>
          <div className="space-y-6 mt-6">
            <div className="p-5 rounded-3xl bg-brand/5 border border-brand/10 space-y-1">
              <p className="text-[9px] font-bold text-brand/60 uppercase tracking-widest">Gezahlte Strafen</p>
              <p className="text-xl font-black text-brand italic">{formatCurrency(stats.finesPaid)}</p>
            </div>
            <div className="p-5 rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Offene Strafen</p>
              <p className="text-xl font-black text-red-500/80 italic">{formatCurrency(stats.finesUnpaid)}</p>
            </div>
            <p className="text-[9px] font-bold text-zinc-600 uppercase leading-relaxed px-2">
              Der Kassenstand (Soll) berücksichtigt alle noch nicht gezahlten Strafen in der Gesamtkalkulation.
            </p>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default FinesDashboard;
