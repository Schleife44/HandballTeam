import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const consent = localStorage.getItem('sechsmeter-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('sechsmeter-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('sechsmeter-cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[10000]"
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Dekorativer Hintergrund-Effekt */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-brand/10 blur-3xl rounded-full" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand/10 p-2 rounded-xl">
                  <ShieldCheck size={24} className="text-brand" />
                </div>
                <h4 className="text-white font-bold tracking-tight">Privatsphäre & Cookies</h4>
              </div>
              
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Wir nutzen Cookies und LocalStorage, um das System stabil zu halten und die Nutzererfahrung zu verbessern. 
                Ohne notwendige Cookies kann das System nicht funktionieren. 
                <button 
                  onClick={() => navigate('/datenschutz')} 
                  className="text-brand hover:text-brand-light ml-1 inline-flex items-center gap-1 transition-colors"
                >
                  Details <ExternalLink size={12} />
                </button>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleDecline} 
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-all uppercase tracking-wider italic"
                >
                  Nur Notwendige
                </button>
                <button 
                  onClick={handleAccept} 
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black text-black bg-brand hover:bg-brand-light transition-all uppercase tracking-wider italic shadow-lg shadow-brand/20"
                >
                  Alle Akzeptieren
                </button>
              </div>
            </div>

            <button 
              className="absolute top-4 right-4 p-1 text-zinc-600 hover:text-white transition-colors"
              onClick={() => setIsVisible(false)}
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
