import React, { Suspense, lazy } from 'react'
import { 
  Routes, 
  Route, 
  Navigate
} from 'react-router-dom'

// Layout
import AppLayout from './components/layout/AppLayout'

// Auth
import AuthGuard from './components/auth/AuthGuard'

// UI
import PageLoader from './components/ui/PageLoader'

// Lazy loaded Core Modules
const LiveGameDashboard = lazy(() => import('./components/game/LiveGameDashboard.jsx'))
const Dashboard = lazy(() => import('./components/dashboard/Dashboard.jsx'))
const Calendar = lazy(() => import('./components/calendar/Calendar.jsx'))
const TacticsBoard = lazy(() => import('./components/tactics/TacticsBoard.jsx'))
const RosterManager = lazy(() => import('./components/roster/RosterManager.jsx'))
const SettingsManager = lazy(() => import('./components/settings/SettingsManager.jsx'))
const LiveAnalytics = lazy(() => import('./components/analytics/LiveAnalytics.jsx'))
const ArchiveManager = lazy(() => import('./components/archive/ArchiveManager.jsx'))
const FinesManager = lazy(() => import('./components/fines/FinesManager.jsx'))
const SocialHub = lazy(() => import('./components/graphics/SocialHub.jsx'))
const JoinTeam = lazy(() => import('./components/auth/JoinTeam.jsx'))

function App() {
  // Pre-fetch high priority routes in background
  React.useEffect(() => {
    const prefetch = () => {
      import('./components/calendar/Calendar.jsx')
      import('./components/game/LiveGameDashboard.jsx')
      import('./components/roster/RosterManager.jsx')
    }
    // Delay pre-fetching to prioritize initial dashboard load
    const timer = setTimeout(prefetch, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AuthGuard>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/join/:teamId" element={<JoinTeam />} />
          <Route path="/*" element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/tactics" element={<TacticsBoard />} />
                <Route path="/game" element={<LiveGameDashboard />} />
                <Route path="/analytics/*" element={<LiveAnalytics />} />
                <Route path="/roster" element={<RosterManager />} />
                <Route path="/history/*" element={<ArchiveManager />} />
                <Route path="/social" element={<SocialHub />} />
                <Route path="/fines" element={<FinesManager />} />
                <Route path="/settings" element={<SettingsManager />} />
              </Routes>
            </AppLayout>
          } />
        </Routes>
      </Suspense>
    </AuthGuard>
  )
}

export default App
