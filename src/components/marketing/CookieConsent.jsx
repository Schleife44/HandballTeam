import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
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
          className="cookie-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="cookie-content">
            <div className="cookie-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <ShieldCheck size={24} className="text-brand" />
                <h4 style={{ margin: 0 }}>Privatsphäre & Cookies</h4>
              </div>
              <p>
                Wir nutzen Cookies und LocalStorage, um das System stabil zu halten und die Nutzererfahrung zu verbessern. 
                Ohne notwendige Cookies kann das System nicht funktionieren. 
                Weitere Informationen findest du in unserer <button onClick={() => navigate('/datenschutz')} className="underline hover:text-white">Datenschutzerklärung</button>.
              </p>
              
              <div className="cookie-actions">
                <button onClick={handleDecline} className="cookie-btn-secondary">Nur Notwendige</button>
                <button onClick={handleAccept} className="cookie-btn-primary">Alle Akzeptieren</button>
              </div>
            </div>
            <button className="cookie-close" onClick={() => setIsVisible(false)}>
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
