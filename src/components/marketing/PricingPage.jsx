import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';
import stripeService from '../../services/StripeService';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Banknote, 
  FileText, 
  Plus, 
  Video, 
  Flame, 
  Share2, 
  Shield,
  Layers,
  Zap,
  TrendingUp,
  Award,
  Menu,
  X
} from 'lucide-react';
import './LandingPage.css';

const PricingPage = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { activeTeamId, isAuthenticated } = useStore();

  const handleCheckout = async (tier) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!activeTeamId) {
      alert('Bitte wähle oder erstelle zuerst ein Team im Dashboard.');
      navigate('/dashboard');
      return;
    }

    try {
      await stripeService.redirectToCheckout(tier, isYearly ? 'yearly' : 'monthly', activeTeamId);
    } catch (e) {
      console.error('[Pricing] Checkout error:', e);
    }
  };

  const prices = {
    starter: { monthly: 5.90, yearly: 4.16 },
    pro: { monthly: 19.90, yearly: 13.93 }
  };

  const formatPrice = (val) => {
    return val % 1 === 0 ? val : val.toFixed(2).replace('.', ',');
  };

  return (
    <div className="landing-root pricing-page">
      {/* Background Glows */}
      <div className="landing-hero-gradient" style={{ left: '80%', top: '20%' }} />
      <div className="landing-hero-gradient" style={{ left: '10%', top: '70%', opacity: 0.1 }} />

      {/* Navigation */}
      <nav className="landing-nav scrolled">
        <div className="landing-container nav-wrap">
          <div className="landing-nav-left">
            <div className="landing-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <div className="landing-brand-icon">6</div>
              <span>SECHSMETER</span>
            </div>
            
            <div className="landing-nav-links main-nav">
              <button onClick={() => navigate('/')} className="landing-nav-link-btn">Startseite</button>
              <button className="landing-nav-link-btn active">Preise</button>
            </div>
          </div>
          
          <div className="landing-nav-right">
            <button onClick={() => navigate('/login')} className="landing-btn landing-btn-primary magnetic">
              Start System
            </button>
          </div>

          <button className="landing-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="landing-mobile-menu"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
          >
            <div className="landing-mobile-menu-links">
              <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }} className="landing-nav-link-btn-mobile">Startseite</button>
              <button onClick={() => navigate('/login')} className="landing-btn landing-btn-primary">
                System Start
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="landing-container" style={{ paddingTop: '150px' }}>
        <div className="landing-section-header">
          <motion.h1 
            className="landing-gradient-text" 
            style={{ fontSize: '4rem' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Wähle deine Stärke.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Transparentes Pricing für ambitionierte Handball-Trainer.
          </motion.p>
        </div>

        {/* Billing Toggle */}
        <div className="billing-toggle-container">
          <span className={!isYearly ? 'active' : ''}>Monatlich</span>
          <label className="landing-switch">
            <input 
              type="checkbox" 
              checked={isYearly}
              onChange={() => setIsYearly(!isYearly)}
            />
            <span className="landing-slider"></span>
          </label>
          <span className={isYearly ? 'active' : ''}>
            Jährlich <span className="discount-badge">30% Rabatt</span>
          </span>
        </div>

        <div className="pricing-grid">
          {/* Starter */}
          <motion.div 
            className="price-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="price-tier">Starter</div>
            <div className="price-amount">
              {formatPrice(isYearly ? prices.starter.yearly : prices.starter.monthly)}€ 
              <span>/ Mo.</span>
            </div>
            <div className="price-subtext">
              {isYearly ? `${formatPrice(prices.starter.yearly * 12)}€ pro Jahr abgerechnet` : ''}
            </div>
            <ul className="price-features">
              <li><Users size={16} /> Unbegrenzte Mitglieder</li>
              <li><Calendar size={16} /> Kalender Sync (iCal/Google)</li>
              <li><CheckCircle size={16} /> RSVP & Anwesenheit</li>
              <li><Banknote size={16} /> Strafenkatalog & Kasse</li>
              <li><FileText size={16} /> PDF/CSV Exporte</li>
            </ul>
            <button onClick={() => handleCheckout('starter')} className="landing-btn landing-btn-outline" style={{ width: '100%' }}>
              Jetzt Starten
            </button>
          </motion.div>

          {/* Pro */}
          <motion.div 
            className="price-card featured"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="price-tier">Pro Team</div>
            <div className="price-amount">
              {formatPrice(isYearly ? prices.pro.yearly : prices.pro.monthly)}€ 
              <span>/ Mo.</span>
            </div>
            <div className="price-subtext">
              {isYearly ? `${formatPrice(prices.pro.yearly * 12)}€ pro Jahr abgerechnet` : ''}
            </div>
            <ul className="price-features">
              <li><Plus size={16} /> Alles aus Starter</li>
              <li><Video size={16} /> Hochpräzise Video-Analyse</li>
              <li><Flame size={16} /> Taktische Heatmaps</li>
              <li><Share2 size={16} /> Social Engine (Matchgrafiken)</li>
              <li><Shield size={16} /> Team Branding</li>
            </ul>
            <button onClick={() => handleCheckout('pro')} className="landing-btn landing-btn-primary" style={{ width: '100%' }}>
              Jetzt Upgraden
            </button>
          </motion.div>

          {/* Elite */}
          <motion.div 
            className="price-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="price-tier">Elite Club</div>
            <div className="price-amount" style={{ fontSize: '2.5rem' }}>
              Individuell
            </div>
            <div className="price-subtext">
              Maßgeschneidert für deinen Verein.
            </div>
            <ul className="price-features">
              <li><Layers size={16} /> Voller Zugriff für alle Trainer</li>
              <li><Users size={16} /> Skalierbar nach Team-Anzahl</li>
              <li><Zap size={16} /> Zentrale Vereins-Verwaltung</li>
              <li><TrendingUp size={16} /> Maximale Kosteneffizienz</li>
              <li><Award size={16} /> Exklusives Vereins-Branding</li>
            </ul>
            <button 
              onClick={() => window.location.href = 'mailto:hallo@sechsmeter.de?subject=Anfrage Elite Club Vereinslösung'} 
              className="landing-btn landing-btn-outline" 
              style={{ width: '100%' }}
            >
              Termin vereinbaren
            </button>
          </motion.div>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-top" style={{ justifyContent: 'center', gap: '3rem' }}>
            <button onClick={() => navigate('/impressum')} className="landing-footer-link">Impressum</button>
            <button onClick={() => navigate('/datenschutz')} className="landing-footer-link">Datenschutz</button>
          </div>
          <div className="landing-container" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', paddingTop: '2rem' }}>
            &copy; 2026 Sechsmeter. Dominate the Game.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
