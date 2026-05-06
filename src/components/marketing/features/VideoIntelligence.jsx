import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ScanEye, 
  ChevronLeft, 
  PlayCircle, 
  BarChart3, 
  Zap, 
  Layers, 
  MousePointerClick,
  CheckCircle2
} from 'lucide-react';
import '../LandingPage.css';

const VideoIntelligence = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      title: "Real-Time Tagging",
      desc: "Markiere Tore, Fehlwürfe oder technische Fehler während das Video läuft. Keine Unterbrechung des Workflows.",
      icon: <MousePointerClick className="text-brand" />
    },
    {
      title: "Automatische Heatmaps",
      desc: "Das System erkennt Wurfpositionen und generiert sofort taktische Heatmaps für Abwehr und Angriff.",
      icon: <Layers className="text-brand" />
    },
    {
      title: "Spieler-Performance",
      desc: "Verknüpfe Szenen direkt mit Spielern, um individuelle Video-Sessions für die Nachbesprechung vorzubereiten.",
      icon: <BarChart3 className="text-brand" />
    }
  ];

  return (
    <div className="landing-root">
      {/* Background Grid is handled by landing-root class in LandingPage.css */}
      
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
              <div className="landing-hero-badge">Deep Dive</div>
              <h1 className="text-5xl lg:text-7xl font-black italic uppercase leading-none mb-8">
                Video <span className="text-brand">Intelligence</span>
              </h1>
              <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
                Verwandle rohes Videomaterial in eine taktische Goldmine. Unsere Intelligence-Engine macht Spielzüge lesbar und zeigt dir genau, wo das Spiel gewonnen oder verloren wurde.
              </p>
              <div className="flex flex-col gap-4">
                {['Frame-genaue Analyse', 'Integrierte Wurfecken-Statistik', 'Export für Team-Besprechungen'].map((item, i) => (
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
                  src="/assets/marketing/videtail.png" 
                  alt="Video Analysis Dashboard" 
                  className="w-full h-auto block"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/10 blur-3xl rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand/10 blur-3xl rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="landing-section bg-zinc-950/50">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2>Der Workflow.</h2>
            <p>Von der Kamera direkt auf das Tablet deiner Spieler.</p>
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

      {/* Deep Detail */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-20">
            <div className="lg:w-1/2">
               <h2 className="text-4xl font-black italic uppercase mb-8">Präzision bis ins <span className="text-brand">Detail</span></h2>
               <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold italic">01</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Live-Modus</h4>
                      <p className="text-zinc-400">Erfasse Daten während des Spiels. Die Timeline synchronisiert sich automatisch mit dem Video, sobald du es hochlädst.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold italic">02</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Multi-Filter</h4>
                      <p className="text-zinc-400">Filtere das Spiel nach "Toren von Linksaußen" oder "Technischen Fehlern in der 2. Halbzeit" mit einem Klick.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold italic">03</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Export-Engine</h4>
                      <p className="text-zinc-400">Erstelle Video-Playlists für deine Spielerbesprechung oder exportiere Statistiken als druckfertiges PDF.</p>
                    </div>
                  </div>
               </div>
            </div>
            <div className="lg:w-1/2">
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-2xl">
                  <img 
                    src="/assets/marketing/feature-heatmap.png" 
                    alt="Tactical Heatmap" 
                    className="rounded-2xl w-full"
                  />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-cta">
        <div className="landing-container">
          <div className="landing-cta-card">
            <h2 className="text-4xl font-black italic uppercase mb-6">Starte deine Analyse.</h2>
            <p className="mb-10">Hol dir den entscheidenden Vorsprung für das nächste Spielwochenende.</p>
            <button onClick={() => navigate('/login')} className="landing-btn landing-btn-primary big">
              Gratis ausprobieren
            </button>
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

export default VideoIntelligence;
