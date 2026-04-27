import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, CheckCircle, TrendingUp, TrendingDown, Users, History, Euro } from 'lucide-react';
import Card from '../../ui/Card';

const DashStatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="p-6">
    <div className="flex items-center gap-4">
      <div className={`p-3 bg-zinc-950 rounded-2xl border border-zinc-800 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className={`text-xl font-black italic uppercase tracking-tighter mt-1 ${color}`}>{value}</p>
      </div>
    </div>
  </Card>
);

const FinesDashboard = ({ 
  stats, 
  playerStats, 
  recentActivity, 
  formatCurrency 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashStatCard label="Kassenstand (Ist)" value={formatCurrency(stats.totalBalance)} icon={Wallet} color="text-brand" />
        <DashStatCard label="Gezahlte Strafen" value={formatCurrency(stats.finesPaid)} icon={CheckCircle} color="text-brand" />
        <DashStatCard label="Sonst. Einnahmen" value={formatCurrency(stats.otherIncome)} icon={TrendingUp} color="text-blue-400" />
        <DashStatCard label="Ausgaben" value={formatCurrency(stats.expenses)} icon={TrendingDown} color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
        <Card className="p-8" title="Schulden-Ranking" icon={Users}>
          <div className="space-y-4">
            {playerStats.map((ps, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/40 hover:border-brand/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 group-hover:bg-brand group-hover:text-black transition-all italic">
                    #{ps.number}
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-100 uppercase italic leading-none">{ps.name}</p>
                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Saison 25/26</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xl font-black italic tabular-nums ${ps.debt > 0 ? 'text-red-500' : 'text-brand'}`}>
                    {formatCurrency(ps.debt)}
                  </span>
                  {ps.debt > 0 && <span className="text-[7px] font-bold text-red-500/50 uppercase tracking-tighter">Zahlung ausstehend</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-8">
          <Card className="p-8 bg-gradient-to-br from-brand/20 to-transparent border-brand/20 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 text-brand/5 group-hover:text-brand/10 transition-all rotate-12">
              <Euro size={120} fill="currentColor" />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic mb-2 relative z-10">Real Cash</h3>
            <div className="text-4xl font-black text-brand italic tracking-tighter mb-4 relative z-10">{formatCurrency(stats.totalBalance)}</div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed max-w-[200px] relative z-10">Aktuell physisch in der Kasse vorhandenes Geld.</p>
          </Card>

          <Card className="p-8" title="Letzte Aktivitäten" icon={History}>
            <div className="space-y-4">
              {recentActivity.map((h, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-800/30 last:border-0">
                  <div className={`w-2 h-2 rounded-full ${h.category === 'expense' ? 'bg-red-500' : h.category === 'income' ? 'bg-blue-500' : (h.paid ? 'bg-brand' : 'bg-red-500/50')}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-zinc-100 uppercase truncate leading-none">{h.playerId === 'TEAM' ? h.category : h.playerId}</p>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase mt-1 truncate">{h.note}</p>
                  </div>
                  <span className={`text-[10px] font-black italic tabular-nums ${h.category === 'expense' ? 'text-red-500' : h.category === 'income' ? 'text-blue-500' : 'text-zinc-400'}`}>
                    {h.category === 'expense' ? '-' : ''}{formatCurrency(h.amount)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default FinesDashboard;
