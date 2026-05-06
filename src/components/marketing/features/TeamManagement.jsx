import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  ChevronLeft, 
  CalendarCheck, 
  Banknote, 
  BarChart, 
  MessageSquare, 
  Bell,
  CheckCircle2
} from 'lucide-react';
import '../LandingPage.css';

const TeamManagement = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      title: "Zu- & Absagen",
      desc: "Behalte den Überblick. Wer kommt zum Training? Wer fehlt beim Spiel? Alles auf einen Blick, ohne WhatsApp-Chaos.",
      icon: <CalendarCheck className="text-brand" />
    },
    {
      title: "Strafenkasse 2.0",
      desc: "Verwalte euren Strafenkatalog digital. Einzahlung tracken, Schuldenstand sehen, Kasse verwalten.",
      icon: <Banknote className="text-brand" />
    },
    {
      title: "Anwesenheits-Check",
      desc: "Statistiken für den Trainer. Wer war wie oft da? Wer ist der Trainingsweltmeister des Monats?",
      icon: <BarChart className="text-brand" />
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
              <div className="landing-hero-badge">Team Organization</div>
              <h1 className="text-5xl lg:text-7xl font-black italic uppercase leading-none mb-8">
                Team <span className="text-brand">Management</span>
              </h1>
              <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
                Schluss mit dem Organisations-Wahnsinn. Sechsmeter vereint Terminplanung, Anwesenheit und Strafenkasse in einem intuitiven System. Entwickelt von Handballern für Handballer.
              </p>
              <div className="flex flex-col gap-4">
                {['Unbegrenzte Mitglieder', 'Interaktive Strafenkasse', 'Exportfähige Listen'].map((item, i) => (
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
                  src="/assets/marketing/orgdetail.png" 
                  alt="Team Management Dashboard" 
                  className="w-full h-auto block"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/10 blur-3xl rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="landing-section bg-zinc-950/50">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2>Volle Kontrolle.</h2>
            <p>Konzentriere dich auf das Training, wir übernehmen den Rest.</p>
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

      {/* Why Sechsmeter? */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-20">
             <div className="lg:w-1/2">
                <h2 className="text-4xl font-black italic uppercase mb-8">Warum <span className="text-brand">Sechsmeter?</span></h2>
                <div className="space-y-6">
                   <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                      <h4 className="font-bold mb-2 flex items-center gap-2"><Bell size={18} className="text-brand" /> Push-Benachrichtigungen</h4>
                      <p className="text-sm text-zinc-400">Erinnere deine Spieler automatisch an anstehende Termine oder fehlende Rückmeldungen.</p>
                   </div>
                   <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                      <h4 className="font-bold mb-2 flex items-center gap-2"><Users size={18} className="text-brand" /> Gast-Spieler Support</h4>
                      <p className="text-sm text-zinc-400">Füge unkompliziert Aushilfen zu einzelnen Terminen hinzu, ohne sie fest in den Kader aufzunehmen.</p>
                   </div>
                   <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                      <h4 className="font-bold mb-2 flex items-center gap-2"><BarChart size={18} className="text-brand" /> Export für Vereine</h4>
                      <p className="text-sm text-zinc-400">Generiere Anwesenheitslisten für die Hallenabrechnung oder Versicherungsmeldungen deines Vereins.</p>
                   </div>
                </div>
             </div>
             <div className="lg:w-1/2">
                <div className="grid grid-cols-2 gap-4">
                   <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-end">
                      <div className="text-4xl font-black text-brand italic">98%</div>
                      <div className="text-xs uppercase font-bold text-zinc-500">Rückmelde-Quote</div>
                   </div>
                   <div className="h-64 bg-brand border border-zinc-800 rounded-3xl p-6 flex flex-col justify-end">
                      <div className="text-4xl font-black text-black italic">100%</div>
                      <div className="text-xs uppercase font-bold text-black/50">Digitaler Workflow</div>
                   </div>
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

export default TeamManagement;
