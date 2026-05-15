import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Activity } from 'lucide-react';

// Store
import useStore from '../../store/useStore';

// Hooks
import { useDashboardStats } from '../../hooks/useDashboardStats';

// UI
import AttendanceModal from './parts/AttendanceModal';
import DashboardCard from './parts/DashboardCard';
import PerformanceChart from './parts/PerformanceChart';

// Modular Components
import DashboardHeader from './components/DashboardHeader';
import UpcomingEvents from './components/UpcomingEvents';
import LiveAnalysisCard from './components/LiveAnalysisCard';
import TopPerformers from './components/TopPerformers';
import StatsGrid from './components/StatsGrid';
import LeagueTable from './components/LeagueTable';

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
    <div className="max-w-[1600px] mx-auto pb-40 px-4 lg:px-12 pt-4 space-y-8 animate-in fade-in duration-1000">
      
      <DashboardHeader teamName={settings?.homeName} />

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 lg:gap-16 items-start">
        
        {/* LEFT COLUMN */}
        <div className="space-y-10">
          <UpcomingEvents 
            events={stats.upcomingEvents} 
            onRsvp={handleRsvp} 
            onDetails={openAttendance} 
            settings={settings} 
          />

          <LiveAnalysisCard 
            onClick={() => stats.todaysGame ? navigate('/game', { state: { ...stats.todaysGame } }) : navigate('/game')} 
          />

          <TopPerformers performers={stats.topPerformers} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-10">
          <StatsGrid stats={stats} />

          <DashboardCard title="Performance Intelligence" icon={TrendingUp}>
            <div className="p-4 bg-zinc-950/20 rounded-[2rem] border border-white/5 shadow-inner">
              <PerformanceChart data={stats.chartData} />
            </div>
          </DashboardCard>

          <LeagueTable 
            leagueTable={stats.leagueTable} 
            loading={stats.loadingTable} 
          />
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
