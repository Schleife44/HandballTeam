import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  ScanEye, 
  Flame, 
  Zap, 
  Share2, 
  ShieldCheck, 
  CloudLightning,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [videoDirection, setVideoDirection] = useState('forward');
  
  const videoForwardRef = useRef(null);
  const videoBackwardRef = useRef(null);

  // Handle Navbar Scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Video Yo-Yo Logic
  useEffect(() => {
    const vForward = videoForwardRef.current;
    const vBackward = videoBackwardRef.current;

    if (vForward && vBackward) {
      vForward.onended = () => {
        setVideoDirection('backward');
        vBackward.currentTime = 0;
        vBackward.play();
      };
      vBackward.onended = () => {
        setVideoDirection('forward');
        vForward.currentTime = 0;
        vForward.play();
      };
    }
  }, []);

  const bentoItems = [
    {
      title: "Video Intelligence",
      desc: "Markiere Schlüsselmomente in Echtzeit. Unsere Timeline macht Spielzüge lesbar und Schwachstellen sichtbar.",
      icon: <ScanEye size={24} />,
      size: "large",
      img: "/assets/marketing/feature-video.png"
    },
    {
      title: "Taktische Heatmaps",
      desc: "Dominanz durch Daten. Analysiere Wurfbilder und gegnerische Laufwege mit höchster Detailtiefe.",
      icon: <Flame size={24} />,
      size: "medium",
      img: "/assets/marketing/feature-heatmap.png"
    },
    {
      title: "Live Analyse",
      desc: "Keine Latenz. Daten direkt während des Spiels erfassen.",
      icon: <Zap size={24} />,
      size: "small",
      gradient: "linear-gradient(135deg, #f59e0b, transparent)"
    },
    {
      title: "Social Engine",
      desc: "High-End Matchgrafiken für deine Community. Automatisch.",
      icon: <Share2 size={24} />,
      size: "small",
      gradient: "linear-gradient(135deg, #ec4899, transparent)"
    }
  ];

  return (
    <div className="landing-root">
      {/* Background Video */}
      <div className="landing-video-container">
        <video 
          ref={videoForwardRef}
          autoPlay 
          muted 
          playsInline 
          className="landing-video"
          style={{ opacity: videoDirection === 'forward' ? 0.6 : 0 }}
        >
          <source src="/assets/marketing/Futuristic_Handball_Court_Animation.mp4" type="video/mp4" />
        </video>
        <video 
          ref={videoBackwardRef}
          muted 
          playsInline 
          className="landing-video"
          style={{ opacity: videoDirection === 'backward' ? 0.6 : 0 }}
        >
          <source src="/assets/marketing/Futuristic_Handball_Court_Animation-ezgif.com-reverse-video.mp4" type="video/mp4" />
        </video>
        <div className="landing-video-overlay" />
      </div>

      <div className="landing-hero-gradient" />

      {/* Navigation */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-container nav-content">
          <div className="landing-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="landing-brand-icon">6</div>
            <span>SECHSMETER</span>
          </div>
          
          <div className="landing-nav-links-center">
            <a href="#intelligence">Intelligence</a>
            <a href="#vision">Vision</a>
            <button onClick={() => navigate('/pricing')} className="landing-nav-link-btn">Preise</button>
          </div>
          
          <div className="landing-nav-right">
            <button onClick={() => navigate('/login')} className="landing-btn landing-btn-primary nav-cta magnetic">
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
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="landing-mobile-menu-links">
              <a href="#intelligence" onClick={() => setIsMobileMenuOpen(false)}>Intelligence</a>
              <a href="#vision" onClick={() => setIsMobileMenuOpen(false)}>Vision</a>
              <button onClick={() => { navigate('/pricing'); setIsMobileMenuOpen(false); }} className="landing-nav-link-btn-mobile">Preise</button>
              <button onClick={() => navigate('/login')} className="landing-btn landing-btn-primary">
                System Start
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <motion.div 
            className="landing-hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="landing-hero-badge">Handball Innovation &bull; Elite Access</div>
            <h1 className="landing-gradient-text">Taktische Dominanz.<br />Präzise Analysiert.</h1>
            <p>Sechsmeter verwandelt Video-Daten in deinen entscheidenden Vorsprung am Wochenende. Entwickelt für Trainer, die den Sieg planen.</p>
            <div className="landing-hero-actions">
              <button onClick={() => navigate('/login')} className="landing-btn landing-btn-primary magnetic">
                Jetzt Initialisieren
              </button>
              <a href="#intelligence" className="landing-btn landing-btn-outline magnetic">
                System Überblick
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Intelligence (Bento Grid) */}
      <section id="intelligence" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Intelligence Core.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Dein Arsenal für den modernen Handball-Erfolg.
            </motion.p>
          </div>

          <div className="landing-bento-grid">
            {bentoItems.map((item, idx) => (
              <motion.div 
                key={idx}
                className={`landing-bento-item ${item.size || ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="landing-bento-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                {item.img && (
                  <div className="landing-bento-ui-card">
                    <img src={item.img} alt={item.title} />
                  </div>
                )}
                {item.gradient && (
                  <div 
                    className="landing-bento-visual-bg" 
                    style={{ background: item.gradient, opacity: 0.05 }} 
                  />
                )}
                {!item.img && !item.gradient && <div className="landing-bento-visual-bg" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="vision" className="landing-stats">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2>Vom Video zum Sieg.</h2>
            <p>Drei Schritte, die deine Spielvorbereitung revolutionieren.</p>
          </div>
          <div className="landing-stats-grid">
            {[
              { num: "01", title: "Rohdaten Erfassen", text: "Lade deine Spiele hoch. Sechsmeter bereitet die Timeline für deine Bearbeitung vor." },
              { num: "02", title: "Muster Erkennen", text: "Heatmaps und Filter helfen dir, die wahren Gründe für Erfolg oder Misserfolg zu finden." },
              { num: "03", title: "Sieg Planen", text: "Verwandle Insights in Coaching-Anweisungen und dominiere die nächste Begegnung." }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                className="landing-stat-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
              >
                <div className="landing-stat-number">{step.num}</div>
                <div className="landing-stat-label-large">{step.title}</div>
                <p>{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-container">
          <motion.div 
            className="landing-cta-card"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="landing-gradient-text">Bereit für Dominanz?</h2>
            <p>Sechsmeter ist der digitale Co-Trainer, der niemals schläft. Starte jetzt deine erste Analyse.</p>
            <div className="landing-cta-actions">
               <button onClick={() => navigate('/login')} className="landing-btn landing-btn-primary magnetic big">
                Jetzt Starten
               </button>
            </div>
            <div className="landing-cta-trust">
                <span>&bull; DSGVO Konform</span>
                <span>&bull; Made in Germany</span>
                <span>&bull; High Performance Cloud</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-top">
            <div className="landing-footer-brand">
              <div className="landing-brand">
                <div className="landing-brand-icon">6</div>
                <span>SECHSMETER</span>
              </div>
              <p>Handball Analyse neu definiert. Für Trainer, die am Wochenende gewinnen wollen.</p>
            </div>
            <div className="landing-footer-col">
              <h4>Navigation</h4>
              <ul>
                <li><a href="#intelligence">Intelligence</a></li>
                <li><a href="#vision">Vision</a></li>
                <li><button onClick={() => navigate('/login')} className="text-zinc-500 hover:text-white transition-colors">Login</button></li>
              </ul>
            </div>
            <div className="landing-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><button onClick={() => navigate('/impressum')} className="landing-footer-link">Impressum</button></li>
                <li><button onClick={() => navigate('/datenschutz')} className="landing-footer-link">Datenschutz</button></li>
              </ul>
            </div>
          </div>
          <div className="landing-footer-bottom">
            &copy; 2026 Sechsmeter. Dominate the Game.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
