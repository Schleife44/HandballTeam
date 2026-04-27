import React from 'react';
import useStore from '../../store/useStore';
import LoginView from './LoginView';
import TeamSelectionOverlay from './TeamSelectionOverlay';
import NamePromptOverlay from './NamePromptOverlay';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }) {
  const { isAuthenticated, isAuthLoading, activeTeamId, activeMember, squad } = useStore();

  console.log('[AuthGuard] State:', { 
    isAuthenticated, 
    isAuthLoading, 
    activeTeamId, 
    activeMemberName: activeMember?.playerName 
  });

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

  if (!activeTeamId) {
    console.log('[AuthGuard] Redirecting to TeamSelectionOverlay');
    return <TeamSelectionOverlay />;
  }

  // WAIT for data hydration before checking roster identity
  if (!squad?.isHydrated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-brand animate-spin" size={40} />
        <span className="text-zinc-500 text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Daten werden geladen...</span>
      </div>
    );
  }

  // If we have a team but no name/ID assigned to this user yet, prompt for it
  const { playerId, playerName } = activeMember || {};
  const roster = squad?.home || [];
  
  // Validation: Check if the link to the roster is still valid
  const idExists = playerId && roster.some(p => p.id === playerId);
  const nameExists = playerName && roster.some(p => p.name === playerName); 

  if (!playerName || playerName === 'Gast' || (!idExists && !nameExists)) {
    console.log('[AuthGuard] Identity invalid or lost (ID and Name missing in roster), showing NamePromptOverlay');
    return <NamePromptOverlay />;
  }

  console.log('[AuthGuard] Identity confirmed, showing App');
  return <>{children}</>;
}
