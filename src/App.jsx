import React, { Suspense, lazy } from 'react'
import { 
  Routes, 
  Route, 
  Navigate,
  useLocation
} from 'react-router-dom'

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Layout
import AppLayout from './components/layout/AppLayout'

// Auth
import AuthGuard from './components/auth/AuthGuard'
import SubscriptionGuard from './components/auth/SubscriptionGuard'

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
const ClubDashboard = lazy(() => import('./components/club/ClubDashboard.jsx'))
const JoinTeam = lazy(() => import('./components/auth/JoinTeam.jsx'))
const LandingPage = lazy(() => import('./components/marketing/LandingPage.jsx'))
const PricingPage = lazy(() => import('./components/marketing/PricingPage.jsx'))
const LegalPage = lazy(() => import('./components/marketing/LegalPage.jsx'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard.jsx'))
const CookieConsent = lazy(() => import('./components/marketing/CookieConsent.jsx'))
const LoginView = lazy(() => import('./components/auth/LoginView.jsx'))

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
      <Suspense fallback={<PageLoader />}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/impressum" element={<LegalPage />} />
          <Route path="/datenschutz" element={<LegalPage />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/join/:teamId" element={<JoinTeam />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/*" element={
            <AuthGuard>
              <AppLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/tactics" element={<TacticsBoard />} />
                  <Route path="/game" element={
                    <SubscriptionGuard title="Live-Spiel Tracking" description="Erfasse Tore, Fehlwürfe und Spielereignisse in Echtzeit. Die professionelle Spielverfolgung ist Teil des Pro-Pakets.">
                      <LiveGameDashboard />
                    </SubscriptionGuard>
                  } />
                  <Route path="/analytics/*" element={
                    <SubscriptionGuard title="Analysen & Statistiken" description="Detaillierte Auswertungen, Heatmaps und Erfolgsquoten. Schalte jetzt Pro frei, um dein Team datenbasiert zu verbessern.">
                      <LiveAnalytics />
                    </SubscriptionGuard>
                  } />
                  <Route path="/club" element={
                    <SubscriptionGuard title="Club Management" requiredTier="elite" description="Verwalte mehrere Teams, sieh clubweite Statistiken und behalte den Überblick über deinen gesamten Verein. Exklusiv im Elite-Paket.">
                      <ClubDashboard />
                    </SubscriptionGuard>
                  } />
                  <Route path="/clubsettings" element={
                    <SubscriptionGuard title="Mitglieder & Rechte" requiredTier="elite" description="Verwalte die Mitglieder deines gesamten Vereins und weise Rollen zu.">
                      <SettingsManager />
                    </SubscriptionGuard>
                  } />
                  <Route path="/roster" element={<RosterManager />} />
                  <Route path="/history/*" element={<ArchiveManager />} />
                  <Route path="/social" element={<SocialHub />} />
                  <Route path="/fines" element={<FinesManager />} />
                  <Route path="/settings" element={<SettingsManager />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppLayout>
            </AuthGuard>
          } />
        </Routes>
        <CookieConsent />
      </Suspense>
  )
}

export default App
