import React from 'react';
import { Filter, Download } from 'lucide-react';

// Hooks
import { useAnalyticsData } from '../../hooks/useAnalyticsData';

// UI
import Button from '../ui/Button';

// Components
import AnalyticsOverview from './components/AnalyticsOverview';
import MatchAnalysis from './components/MatchAnalysis';

const AnalyticsDashboard = () => {
  const {
    processedMatches,
    selectedMatch,
    setSelectedMatch
  } = useAnalyticsData();

  if (selectedMatch) {
    return (
      <MatchAnalysis 
        match={selectedMatch} 
        onBack={() => setSelectedMatch(null)} 
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-zinc-100">Spiel-Analyse</h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Auswertung deiner taktischen Daten</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" icon={Filter} />
          <Button variant="ghost" size="icon" icon={Download} />
        </div>
      </header>

      <AnalyticsOverview 
        matches={processedMatches} 
        onSelectMatch={setSelectedMatch} 
      />
    </div>
  );
};

export default AnalyticsDashboard;
