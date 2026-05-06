import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Share2, 
  ChevronLeft, 
  Camera, 
  Image as ImageIcon, 
  Palette, 
  Zap, 
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import '../LandingPage.css';

const SocialEngine = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      title: "Auto-Graphics",
      desc: "Erstelle aus deinen Spieldaten sofort professionelle Match-Ergebnisse, Top-Scorer Grafiken und MVP-Cards.",
      icon: <ImageIcon className="text-brand" />
    },
    {
      title: "Team Branding",
      desc: "Hinterlege deine Vereinsfarben und Logos. Alle Grafiken werden automatisch in deinem Design generiert.",
      icon: <Palette className="text-brand" />
    },
    {
      title: "Social Sharing",
      desc: "Direkter Export für Instagram Stories und Feed. Verwandle dein Team in eine Marke.",
      icon: <Camera className="text-brand" />
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
              Jetzt starten
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
              <div className="landing-hero-badge">Growth & Marketing</div>
              <h1 className="text-5xl lg:text-7xl font-black italic uppercase leading-none mb-8">
                Social <span className="text-brand">Engine</span>
              </h1>
              <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
                Dein Team verdient eine Bühne. Generiere High-End Matchgrafiken in Sekunden statt Stunden. Automatisch, professionell und perfekt für deine Community.
              </p>
              <div className="flex flex-col gap-4">
                {['Automatisches Branding', 'Instagram Story Formate', 'Echtzeit Match-Updates'].map((item, i) => (
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
                  src="/assets/marketing/sodetail.png" 
                  alt="Social Media Graphics Dashboard" 
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
            <h2>Präsenz zeigen.</h2>
            <p>Vom Spielfeld direkt in die Feeds deiner Fans.</p>
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

      {/* Mobile Experience */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
               <h2 className="text-4xl font-black italic uppercase mb-8">Überall <span className="text-brand">Einsatzbereit</span></h2>
               <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold italic">01</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Web & Mobile</h4>
                      <p className="text-zinc-400">Verwalte deine Grafiken am Desktop oder erstelle sie direkt nach dem Abpfiff in der Kabine auf dem Smartphone.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold italic">02</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Ein Klick Export</h4>
                      <p className="text-zinc-400">Kein Photoshop nötig. Wähle eine Vorlage, klicke auf Generieren und teile das Ergebnis sofort.</p>
                    </div>
                  </div>
               </div>
            </div>
            <div className="lg:w-1/2">
               <div className="relative mx-auto w-[280px] h-[580px] bg-zinc-900 border-[8px] border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden">
                  <img 
                    src="/assets/marketing/social-mobile-preview.png" 
                    alt="Mobile App Preview" 
                    className="w-full h-full object-cover"
                  />
               </div>
            </div>
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

export default SocialEngine;
