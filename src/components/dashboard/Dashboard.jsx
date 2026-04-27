import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  Shield,
  Trophy,
  List,
  Play
} from 'lucide-react';

// Store
import useStore from '../../store/useStore';

// Hooks
import { useDashboardStats } from '../../hooks/useDashboardStats';

// UI
import Badge from '../ui/Badge';

// Modular Parts
import DashboardCard from './parts/DashboardCard';
import StatCard from './parts/StatCard';
import EventRow from './parts/EventRow';
import AttendanceModal from './parts/AttendanceModal';
import PerformanceChart from './parts/PerformanceChart';

export default function Dashboard() {
  const navigate = useNavigate();
  const { updateEventStatus, activeMember } = useStore();
  const { stats, settings } = useDashboardStats();

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleRsvp = (eventId, status, reason = '') => {
    const myName = activeMember?.playerName;
    updateEventStatus(eventId, myName, status, reason);
  };

  const openAttendance = (id) => {
    const event = stats.upcomingEvents.find(e => e.id === id);
    if (event) {
      setSelectedEvent(event);
      setAttendanceModalOpen(true);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto pb-32 px-4 lg:px-8 pt-4 space-y-8 lg:space-y-12 animate-in fade-in duration-1000">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase italic text-zinc-100">Hub</h1>
            <Badge variant="brand" className="px-3 py-1 text-[10px]">v2.1</Badge>
          </div>
          <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">{(settings && settings.homeName) || 'Lädt...'} — Official Dashboard</p>
        </div>
        <div className="flex items-center md:items-end gap-3 md:flex-col">
          <span className="text-xl lg:text-2xl font-black text-zinc-100 tracking-tighter">
            {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}
          </span>
          <span className="text-[10px] font-black uppercase text-brand tracking-widest">{new Date().toLocaleDateString('de-DE', { weekday: 'long' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: ACTION COLUMN */}
        <div className="space-y-8 lg:space-y-12 order-1 lg:order-1">
          <section className="space-y-6 lg:space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-brand rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">Upcoming</h3>
            </div>
            <div className="space-y-2">
              {Array.isArray(stats.upcomingEvents) && stats.upcomingEvents.map(e => <EventRow key={e.id} {...e} onRsvp={handleRsvp} onDetails={openAttendance} settings={settings || {}} />)}
            </div>
          </section>

          <div 
            onClick={() => navigate('/game')}
            className="hub-card p-8 lg:p-10 bg-gradient-to-br from-brand/20 to-black border border-brand/20 rounded-[2.5rem] lg:rounded-[3rem] relative overflow-hidden group cursor-pointer transition-all hover:border-brand/40 shadow-2xl"
          >
            <motion.div 
              initial={{ x: 60, y: 60, scale: 0.8, opacity: 0, rotate: 20 }}
              animate={{ x: 0, y: 0, scale: 1.1, opacity: 1, rotate: 12 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="absolute -right-10 -bottom-10 text-brand/5 group-hover:text-brand/10 transition-all group-hover:rotate-6 group-hover:scale-[1.15] duration-700 pointer-events-none"
            >
              <Play size={240} fill="currentColor" />
            </motion.div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
                <span className="text-[10px] font-black uppercase text-brand tracking-[0.3em]">System Ready</span>
              </div>
              <h3 className="text-3xl lg:text-4xl font-black text-white uppercase italic leading-none tracking-tighter">Live <br /><span className="text-brand">Analyse</span></h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed max-w-[200px] opacity-80 group-hover:opacity-100 transition-opacity">Datenaufzeichnung in Echtzeit starten.</p>
            </div>
          </div>

          <DashboardCard title="Top Performers" icon={Trophy}>
            <div className="space-y-4">
              {Array.isArray(stats.topPerformers) && stats.topPerformers.slice(0, 5).map((p, idx) => (
                <div key={p.id || idx} className="flex items-center justify-between p-3.5 rounded-2xl lg:rounded-3xl bg-zinc-900/40 border border-zinc-800/40 hover:border-brand/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl lg:rounded-2xl bg-zinc-800 flex items-center justify-center text-[9px] font-black text-zinc-500 group-hover:bg-brand group-hover:text-black transition-all">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-100 uppercase italic leading-none">{p.name || 'Spieler'}</p>
                      <p className="text-[6px] font-bold text-zinc-700 uppercase tracking-widest mt-1">Season 25/26</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-brand tabular-nums italic">{p.goals || 0}</span>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        {/* RIGHT CONTENT: ANALYTICS HUB */}
        <div className="space-y-8 lg:space-y-12 order-2 lg:order-2">
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard label="Tore Gesamt" value={stats.totalGoals} icon={Target} trend={12} />
            <StatCard label="Win Rate" value={`${stats.winRate}%`} icon={Trophy} trend={5} />
            <StatCard label="Gegentore" value={stats.totalConceded} icon={Shield} trend={-8} />
            <StatCard label="Ø Tore" value={stats.avgGoals} icon={TrendingUp} trend={3} />
          </div>

          <DashboardCard title="Performance Analytics" icon={TrendingUp}>
            <PerformanceChart data={stats.chartData} />
          </DashboardCard>

          <DashboardCard title="Ligatabelle — Live Standings" icon={List}>
            <div className="overflow-x-auto -mx-6 lg:mx-0">
              <table className="w-full text-left min-w-[500px] lg:min-w-0">
                <thead>
                  <tr className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] border-b border-zinc-800/40">
                    <th className="pb-4 px-6">Rank</th>
                    <th className="pb-4 px-6">Team</th>
                    <th className="pb-4 px-6 text-center">Played</th>
                    <th className="pb-4 px-6 text-center">Diff</th>
                    <th className="pb-4 px-6 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold">
                  {stats.loadingTable ? (
                    <tr><td colSpan="5" className="py-20 text-center"><div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin mx-auto" /></td></tr>
                  ) : Array.isArray(stats.leagueTable) ? stats.leagueTable.map((t, i) => (
                    <tr key={i} className={`border-b border-zinc-800/10 transition-colors ${t.isMyTeam ? 'bg-brand/5 text-brand' : 'text-zinc-500 hover:bg-zinc-900/30'}`}>
                      <td className="py-5 px-6 opacity-40 font-black italic">{t.rank}</td>
                      <td className="py-5 px-6 font-black uppercase italic tracking-tight text-sm">{t.team}</td>
                      <td className="py-5 px-6 text-center tabular-nums">{t.games}</td>
                      <td className="py-5 px-6 text-center tabular-nums">{t.diff}</td>
                      <td className="py-5 px-6 text-right font-black tabular-nums text-sm italic">{t.points}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="py-20 text-center text-zinc-800 uppercase text-[10px] tracking-widest italic">Waiting for connection to Handball.net...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>
      </div>

      <AttendanceModal 
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
