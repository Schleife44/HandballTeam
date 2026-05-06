import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudOff, AlertTriangle, Wifi, RefreshCw } from 'lucide-react';
import useStore from '../../store/useStore';

const SyncStatusBanner = () => {
  const { syncStatus, setSyncStatus } = useStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncStatus === 'offline') setSyncStatus('online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus, setSyncStatus]);

  if (syncStatus === 'online' && isOnline) return null;

  const config = {
    offline: {
      icon: CloudOff,
      title: 'Offline-Modus',
      desc: 'Deine Änderungen werden lokal gespeichert und synchronisiert, sobald du wieder online bist.',
      color: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
      iconColor: 'text-orange-500'
    },
    quota_exceeded: {
      icon: AlertTriangle,
      title: 'Limit erreicht',
      desc: 'Das tägliche Daten-Limit ist erschöpft. Die Synchronisierung pausiert bis morgen.',
      color: 'bg-red-500/10 border-red-500/20 text-red-500',
      iconColor: 'text-red-500'
    }
  };

  const current = config[syncStatus] || config.offline;
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`w-full border-b backdrop-blur-md z-50 overflow-hidden ${current.color}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-black/20 ${current.iconColor}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                {current.title}
              </p>
              <p className="text-[10px] font-bold opacity-80 leading-tight">
                {current.desc}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <RefreshCw size={12} />
            Neu laden
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SyncStatusBanner;
