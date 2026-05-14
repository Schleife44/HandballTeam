import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import TeamSelectionOverlay from './TeamSelectionOverlay';
import NamePromptOverlay from './NamePromptOverlay';
import { Loader2 } from 'lucide-react';

import LoginView from './LoginView';

export default function AuthGuard({ children }) {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const isAuthLoading = useStore(state => state.isAuthLoading);
  const activeTeamId = useStore(state => state.activeTeamId);
  const activeMember = useStore(state => state.activeMember);
  const squad = useStore(state => state.squad);
  const isMemberLoading = useStore(state => state.isMemberLoading);
  const navigate = useNavigate();
  const location = useLocation();

  const isClubMode = activeTeamId === 'CLUB_OVERVIEW';
  
  // Hydration Timeout: If data takes too long, redirect to team selection
  const [hydrationTimedOut, setHydrationTimedOut] = React.useState(false);
  
  React.useEffect(() => {
    if (activeTeamId && !squad?.isHydrated && activeTeamId !== 'CLUB_OVERVIEW') {
      const timer = setTimeout(() => {
        console.warn('[AuthGuard] Hydration timed out. Redirecting to team selection.');
        setHydrationTimedOut(true);
      }, 5000); // 5 seconds grace period
      return () => clearTimeout(timer);
    }
  }, [activeTeamId, squad?.isHydrated]);

  // Context-Aware Redirection (Force landing on headquarters after switch)
  React.useEffect(() => {
    if (!isAuthenticated || isAuthLoading) return;
    
    const isClubPath = location.pathname.startsWith('/club');
    const isNeutralPath = location.pathname === '/login' || location.pathname === '/';

    if (isClubMode && !isClubPath && !isNeutralPath) {
      console.log('[AuthGuard] Club Mode active but on team path, forcing /club');
      navigate('/club', { replace: true });
    } else if (!isClubMode && activeTeamId && isClubPath) {
      console.log('[AuthGuard] Team Mode active but on club path, forcing /dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [activeTeamId, isAuthenticated, isAuthLoading, location.pathname, navigate]);
  
  // LOGGING - Moved up to comply with Rules of Hooks
  React.useEffect(() => {
    if (isAuthenticated && activeTeamId) {
      console.log('[AuthGuard] Access granted, showing App (Mode: ' + (isClubMode ? 'CLUB' : 'TEAM') + ')');
    }
  }, [isClubMode, activeTeamId, isAuthenticated]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-brand animate-spin" size={40} />
        <span className="text-zinc-500 text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Initialisierung...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[AuthGuard] Redirecting to LoginView');
    return <LoginView />;
  }

  if (!activeTeamId || hydrationTimedOut) {
    console.log('[AuthGuard] Redirecting to TeamSelectionOverlay (No ID or Timeout)');
    return <TeamSelectionOverlay />;
  }

  const isClubPath = location.pathname.startsWith('/club');
  const isNeutralPath = location.pathname === '/login' || location.pathname === '/';

  // Prevent flicker: If mode and path are out of sync, show loader until useEffect redirects
  if (isAuthenticated && !isNeutralPath) {
    if (isClubMode && !isClubPath) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
          <Loader2 className="text-brand animate-spin" size={40} />
          <span className="text-zinc-500 text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Wechsle zum Club Management...</span>
        </div>
      );
    }
    if (!isClubMode && isClubPath) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
          <Loader2 className="text-brand animate-spin" size={40} />
          <span className="text-zinc-500 text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Wechsle zur Mannschaft...</span>
        </div>
      );
    }
  }

  // If we have a team but no name/ID assigned to this user yet, prompt for it
  // SKIP this for Club Mode
  if (!isClubMode) {
    // SaaS OPTIMIZATION: Don't wait for the roster indefinitely in the global guard
    // We only wait if we are NOT timed out and REALLY need the core hydration
    const isCorrectTeamLoaded = squad?.contextId === activeTeamId;
    const isActuallyLoading = !hydrationTimedOut && (!squad?.isHydrated || !squad?.isRosterHydrated || !isCorrectTeamLoaded || isMemberLoading);

    if (isActuallyLoading) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
          <Loader2 className="text-brand animate-spin" size={40} />
          <span className="text-zinc-500 text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Synchronisiere Mannschaft...</span>
        </div>
      );
    }

    const { playerId, playerName } = activeMember || {};
    const profileName = useStore.getState().profile?.playerName;
    const effectiveName = playerName || profileName;
    
    const roster = squad?.home || [];
    const idExists = playerId && roster.some(p => p.id === playerId);
    
    const normalizedEffectiveName = effectiveName?.trim().toLowerCase();
    const nameExists = normalizedEffectiveName && roster.some(p => 
      p.name?.trim().toLowerCase() === normalizedEffectiveName
    ); 

    const rosterIsEmpty = roster.length === 0;
    const isLinked = idExists || nameExists;
    const shouldPrompt = !isClubMode && squad?.isRosterHydrated && !rosterIsEmpty && (!effectiveName || effectiveName === 'Gast' || !isLinked);

    if (shouldPrompt) {
      console.log('[AuthGuard] Identity invalid or lost, showing NamePromptOverlay');
      return <NamePromptOverlay />;
    }
  }

  return <>{children}</>;
}
