import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ChevronLeft, 
  Smartphone, 
  Activity, 
  Trophy, 
  Clock,
  CheckCircle2
} from 'lucide-react';
import '../LandingPage.css';

const LiveAnalysisDetail = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      title: "Zero Latenz",
      desc: "Erfasse Tore, Paraden und Fehler sekundengenau. Die Daten sind sofort für das Trainer-Team verfügbar.",
      icon: <Clock className="text-brand" />
    },
    {
      title: "Optimierte UI",
      desc: "Große Buttons, intuitive Gesten. Entwickelt für die Hektik am Spielfeldrand auf Tablets und Smartphones.",
      icon: <Smartphone className="text-brand" />
    },
    {
      title: "Direktes Feedback",
      desc: "Sieh sofort, welcher Spieler gerade eine Pechsträhne hat oder wo die gegnerische Abwehr Lücken lässt.",
      icon: <Activity className="text-brand" />
    }
  ];

  return (
    <div className="landing-root">
      <nav className="landing-nav scrolled">
        <div className="landing-container nav-content">
          <div className="landing-nav-left">
            <button onClick={() => navigate('/')} className="legal-back-btn">
              <ChevronLeft size={20} />
              <span>Zurück</span>
            </button>
            <div className="landing-brand">
              <div className="landing-brand-icon">6</div>
              <span>SECHSMETER</span>
            </div>
          </div>
          <div className="landing-nav-right">
            <button onClick={() => navigate('/login')} className="landing-btn landing-btn-primary">
              Jetzt testen
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero" style={{ height: 'auto', paddingTop: '160px', paddingBottom: '100px' }}>
        <div className="landing-container">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="landing-hero-badge">Real-Time Performance</div>
              <h1 className="text-5xl lg:text-7xl font-black italic uppercase leading-none mb-8">
                Live <span className="text-brand">Analyse</span>
              </h1>
              <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
                Das Spiel wartet nicht auf die Nachbereitung. Erfasse spielentscheidende Daten direkt während der 60 Minuten und triff fundierte Entscheidungen in der Auszeit.
              </p>
              <div className="flex flex-col gap-4">
                {['Ein-Hand-Bedienung', 'Offline-Modus Support', 'Live-Statistik Dashboard'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-zinc-200">
                    <CheckCircle2 size={18} className="text-brand" />
                    <span className="font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              className="lg:w-1/2 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative z-10 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl shadow-brand/10 bg-zinc-900">
                <img 
                  src="/assets/marketing/live-analysis-preview.png" 
                  alt="Live Analysis Dashboard" 
                  className="w-full h-auto block"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/10 blur-3xl rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="landing-section bg-zinc-950/50">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2>Am Puls des Spiels.</h2>
            <p>Maximale Erkenntnisse bei minimalem Aufwand am Spielfeldrand.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                <p className="text-zinc-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-top" style={{ justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <a href="mailto:info@sechsmeter.de" className="landing-footer-link" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>info@sechsmeter.de</a>
            <button onClick={() => navigate('/impressum')} className="landing-footer-link">Impressum</button>
            <button onClick={() => navigate('/datenschutz')} className="landing-footer-link">Datenschutz</button>
          </div>
          <div className="landing-footer-bottom" style={{ textAlign: 'center', borderTop: 'none', paddingTop: '2rem' }}>
            &copy; 2026 Sechsmeter. Dominate the Game.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LiveAnalysisDetail;
