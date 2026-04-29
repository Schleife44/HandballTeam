import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, FileText, Scale } from 'lucide-react';
import './LandingPage.css';

const LegalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [type, setType] = useState('impressum');

  useEffect(() => {
    if (location.pathname.includes('datenschutz')) {
      setType('datenschutz');
    } else {
      setType('impressum');
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const ImpressumContent = () => (
    <div className="legal-content-inner">
      <section>
        <h2>Angaben gemäß § 5 TMG</h2>
        <p>Hendrik [Nachname]<br />
        [Straße Hausnummer]<br />
        [PLZ Ort]</p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>Telefon: [Deine Telefonnummer]<br />
        E-Mail: [Deine E-Mail Adresse]</p>
      </section>

      <section>
        <h2>Redaktionell verantwortlich</h2>
        <p>Hendrik [Nachname]<br />
        [Straße Hausnummer]<br />
        [PLZ Ort]</p>
      </section>

      <section>
        <h2>EU-Streitschlichtung</h2>
        <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>.<br />
        Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
      </section>

      <section>
        <h2>Verbraucher­streit­beilegung/Universal­schlichtungs­stelle</h2>
        <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </section>
    </div>
  );

  const DatenschutzContent = () => (
    <div className="legal-content-inner">
      <section>
        <h2>1. Datenschutz auf einen Blick</h2>
        <h3>Allgemeine Hinweise</h3>
        <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>
      </section>

      <section>
        <h2>2. Datenerfassung auf dieser Website</h2>
        <h3>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h3>
        <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle“ in dieser Datenschutzerklärung entnehmen.</p>
        
        <h3>Wie erfassen wir Ihre Daten?</h3>
        <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular oder bei der Registrierung eingeben.</p>
        <p>Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).</p>
      </section>

      <section>
        <h2>3. Hosting und Content Delivery Networks (CDN)</h2>
        <h3>Firebase Hosting</h3>
        <p>Wir hosten unsere Website bei Firebase (Google Ireland Limited). Firebase ist ein Dienst von Google, der unter anderem Hosting-Dienste bereitstellt. Firebase erfasst Log-Daten wie IP-Adressen und Browsertypen, um die Sicherheit und Stabilität des Dienstes zu gewährleisten.</p>
      </section>

      <section>
        <h2>4. Cookies und Local Storage</h2>
        <p>Unsere Website nutzt Cookies und Local Storage, um die Funktionalität zu gewährleisten und Ihre Einstellungen zu speichern.</p>
        <h3>Essentielle Daten (Technisch notwendig)</h3>
        <p>Diese Daten sind zwingend erforderlich, damit Sie sich einloggen und das Sechsmetertool nutzen können:</p>
        <ul>
          <li><strong>Firebase Auth:</strong> Speichert Ihren Login-Status, damit Sie beim Wechsel der Seiten eingeloggt bleiben.</li>
          <li><strong>System-Präferenzen:</strong> Speichert z.B. Ihre Team-Auswahl oder Ihre Cookie-Entscheidung im LocalStorage des Browsers.</li>
        </ul>
        <p>Rechtsgrundlage für diese Verarbeitung ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am Betrieb der Anwendung).</p>
      </section>

      <section>
        <h2>4. Registrierung auf dieser Website</h2>
        <p>Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen auf der Seite zu nutzen. Die dazu eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes, für den Sie sich registriert haben. Die bei der Registrierung abgefragten Pflichtangaben müssen vollständig angegeben werden. Andernfalls werden wir die Registrierung ablehnen.</p>
      </section>

      <section>
        <h2>5. Analyse-Tools und Tools von Dritt­anbietern</h2>
        <p>Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. Das geschieht vor allem mit Cookies und mit sogenannten Analyseprogrammen. Die Analyse Ihres Surf-Verhaltens erfolgt in der Regel anonym; das Surf-Verhalten kann nicht zu Ihnen zurückverfolgt werden.</p>
      </section>
      
      <section>
        <h2>6. Ihre Rechte</h2>
        <p>Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.</p>
      </section>
    </div>
  );

  return (
    <div className="landing-root legal-page">
      <div className="landing-hero-gradient" style={{ opacity: 0.1 }} />
      
      <nav className="landing-nav scrolled">
        <div className="landing-container nav-content legal-nav">
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
             <div className="legal-tabs">
                <button 
                  className={type === 'impressum' ? 'active' : ''} 
                  onClick={() => navigate('/impressum')}
                >
                  <Scale size={16} /> Impressum
                </button>
                <button 
                  className={type === 'datenschutz' ? 'active' : ''} 
                  onClick={() => navigate('/datenschutz')}
                >
                  <Shield size={16} /> Datenschutz
                </button>
             </div>
          </div>
        </div>
      </nav>

      <div className="landing-container" style={{ paddingTop: '150px', paddingBottom: '100px' }}>
        <motion.div 
          className="legal-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={type}
        >
          <div className="legal-header">
            {type === 'impressum' ? <FileText size={40} className="text-brand" /> : <Shield size={40} className="text-brand" />}
            <h1 className="landing-gradient-text">
              {type === 'impressum' ? 'Impressum' : 'Datenschutzerklärung'}
            </h1>
          </div>
          
          <div className="legal-body">
            {type === 'impressum' ? <ImpressumContent /> : <DatenschutzContent />}
          </div>
        </motion.div>
      </div>

      <footer className="landing-footer">
        <div className="landing-container" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          &copy; 2026 Sechsmeter. Dominate the Game.
        </div>
      </footer>
    </div>
  );
};

export default LegalPage;
