import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudOff, AlertTriangle, Wifi, RefreshCw } from 'lucide-react';
import useStore from '../../store/useStore';

const SyncStatusBanner = () => {
  const { syncStatus, setSyncStatus } = useStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncStatus === 'offline') setSyncStatus('online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    // DEBOUNCE OFFLINE STATE: Only show banner if truly offline/error for more than 1.5s
    // We only care about explicit error states
    const isExplicitlyOffline = syncStatus === 'offline' || !isOnline;
    const isQuotaExceeded = syncStatus === 'quota_exceeded';
    const shouldShow = isExplicitlyOffline || isQuotaExceeded;
    
    let timeout;

    if (shouldShow) {
      timeout = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
    } else {
      setShowBanner(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timeout) clearTimeout(timeout);
    };
  }, [syncStatus, setSyncStatus, isOnline]);

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

  const current = syncStatus === 'quota_exceeded' ? config.quota_exceeded : config.offline;
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {showBanner && (syncStatus !== 'online' || !isOnline) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`w-full border-b backdrop-blur-md z-[100] overflow-hidden sticky top-0 ${current.color}`}
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
      )}
    </AnimatePresence>
  );
};

export default SyncStatusBanner;
