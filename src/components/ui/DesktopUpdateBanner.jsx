import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';

export default function DesktopUpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.onUpdateDownloaded) {
      window.electronAPI.onUpdateDownloaded((info) => {
        setUpdateInfo(info);
        setIsVisible(true);
      });
    }
  }, []);

  if (!isVisible || !updateInfo) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-brand/30 p-1 pl-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px]">
        <div className="flex flex-col py-2">
          <div className="flex items-center gap-2 text-brand text-xs font-black uppercase italic tracking-wider">
            <Download size={14} />
            Update Verfügbar
          </div>
          <div className="text-white text-sm font-medium">
            Version {updateInfo.version} ist bereit
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button 
            onClick={() => window.electronAPI.restartApp()}
            className="bg-brand hover:bg-brand-bright text-black text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 italic uppercase"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            Jetzt Neustarten
          </button>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="p-2.5 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
