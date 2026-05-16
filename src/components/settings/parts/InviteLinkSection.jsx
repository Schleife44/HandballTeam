import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { RefreshCw, Users, QrCode, Download } from 'lucide-react';
import Button from '../../ui/Button';
import SettingsSection from './SettingsSection';
import useStore from '../../../store/useStore';

const InviteLinkSection = ({ activeTeamId, settings, notify }) => {
  const { generateInviteToken } = useStore();

  const inviteUrl = settings.inviteToken 
    ? `${window.location.origin}/join/${activeTeamId || ''}?token=${settings.inviteToken}` 
    : 'Kein aktiver Link';

  // Generate a branded logo (Logo + Text) for the QR code center
  const getBrandedLogo = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (settings?.teamLogo) {
      // If logo exists, we return it directly for now to keep it simple and robust
      return settings.teamLogo;
    }

    // PURE TEXT VERSION (ONE LINE, HUGE)
    // Using 800x160 for a very wide, clear banner
    canvas.width = 800;
    canvas.height = 160;
    
    // Clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 160);

    // Matching the Dashboard Branding: font-black (900), italic, uppercase
    // Using system-ui as it resolves to Inter/San-Serif used in the app
    ctx.font = 'italic 900 110px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '-4px'; // tracking-tighter equivalent
    
    const text = 'SECHSMETER';
    const sechWidth = ctx.measureText('SECHS').width;
    const totalWidth = ctx.measureText(text).width;
    const startX = (800 - totalWidth) / 2;
    
    // Draw "SECHS" in Brand Green
    ctx.fillStyle = '#84cc16';
    ctx.fillText('SECHS', startX, 85);
    
    // Draw "METER" in Black
    ctx.fillStyle = '#000000';
    ctx.fillText('METER', startX + sechWidth, 85);
    
    return canvas.toDataURL();
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('invite-qr-code');
    if (!canvas) return;
    
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `sechsmeter-invite-qr-${settings.inviteToken.substring(0, 8)}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    notify('QR-Code wird heruntergeladen...');
  };

  return (
    <SettingsSection title="Mitspieler einladen" icon={Users} iconColor="brand" className="md:col-span-2 bg-gradient-to-br from-brand/10 to-transparent">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase italic">Sicherer Team-Beitrittslink</h4>
            <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed max-w-xl">
              Generiere einen Link mit Sicherheitstoken. Dieser Link ist aus Sicherheitsgründen 48 Stunden gültig. Spieler können den Code scannen oder den Link manuell öffnen.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input 
                readOnly
                value={inviteUrl}
                className="w-full bg-black/60 border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-bold text-zinc-400 outline-none focus:border-brand/30 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {settings.inviteToken && (
                <Button 
                  variant="primary" 
                  size="lg"
                  className="px-8"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl);
                    notify('Sicherheits-Link kopiert!');
                  }}
                >
                  Kopieren
                </Button>
              )}
              <Button 
                variant="outline" 
                size="lg"
                icon={RefreshCw}
                onClick={async () => {
                  await generateInviteToken();
                  notify('Neuer Sicherheits-Link generiert!');
                }}
              >
                {settings.inviteToken ? 'Erneuern' : 'Generieren'}
              </Button>
            </div>
          </div>

          {settings.inviteToken && (
            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-white/5 w-fit">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                Token aktiv bis: {new Date(settings.inviteTokenExpiresAt).toLocaleString('de-DE')}
              </span>
            </div>
          )}
        </div>

        {/* QR CODE DISPLAY */}
        {settings.inviteToken && (
          <div className="flex flex-col items-center gap-4 bg-zinc-950/50 p-6 rounded-[3.5rem] border border-white/5 group relative">
            <div className="absolute -top-3 -right-3 bg-brand text-black p-2 rounded-xl shadow-xl shadow-brand/20 rotate-12 z-10">
              <QrCode size={16} strokeWidth={3} />
            </div>
            
            <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
              <QRCodeCanvas 
                id="invite-qr-code"
                value={inviteUrl} 
                size={240}
                level={"H"}
                includeMargin={false}
                imageSettings={{
                  src: getBrandedLogo(),
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 140, // Reduced from 220 to ensure scannability
                  excavate: true,
                }}
              />
            </div>

            <button 
              onClick={downloadQRCode}
              className="flex items-center gap-2 text-[8px] font-black uppercase text-zinc-500 hover:text-brand transition-colors tracking-widest"
            >
              <Download size={12} /> QR-Code speichern
            </button>
          </div>
        )}
      </div>
    </SettingsSection>
  );
};

export default InviteLinkSection;
