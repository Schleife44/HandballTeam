import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Lock, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';

/**
 * SubscriptionGuard
 * Protects components based on the current team's subscription tier.
 */
const SubscriptionGuard = ({ 
  children, 
  requiredTier = 'pro', 
  title = "Premium Feature",
  description = "Dieses Feature ist Teil des Pro-Pakets. Upgrade jetzt, um alle Vorteile zu nutzen."
}) => {
  const navigate = useNavigate();
  const { subscription, activeTeamId } = useStore();
  
  // Tier levels for comparison
  const tiers = {
    'starter': 0,
    'pro': 1,
    'elite': 2
  };

  const isClubMode = activeTeamId === 'CLUB_OVERVIEW';
  const currentTierLevel = tiers[subscription?.tier] || 0;
  const requiredTierLevel = tiers[requiredTier];

  // Logic: In Club Mode, we always allow elite-level components to render
  // (because only elite users can enter this mode anyway)
  const hasAccess = isClubMode ? true : (currentTierLevel >= requiredTierLevel);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-zinc-800 p-8 text-center">
      {/* Blurred Preview Background (if children were visible, but here we just block) */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-10" />
      
      <div className="relative z-20 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center">
          <Crown className="text-brand w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Lock size={20} className="text-zinc-500" /> {title}
          </h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => navigate('/pricing')}
            className="px-6 py-3 bg-brand text-black font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform"
          >
            Jetzt Upgraden <Zap size={18} />
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors"
          >
            Zurück zur Startseite
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          Du nutzt aktuell den <strong>{subscription?.tier === 'starter' ? 'Starter' : 'Basis'}</strong> Tarif.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionGuard;
