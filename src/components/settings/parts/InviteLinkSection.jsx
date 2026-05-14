import React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import Button from '../../ui/Button';
import SettingsSection from './SettingsSection';
import useStore from '../../../store/useStore';

const InviteLinkSection = ({ activeTeamId, settings, notify }) => {
  const { generateInviteToken } = useStore();

  const inviteUrl = settings.inviteToken 
    ? `${window.location.origin}/join/${activeTeamId || ''}?token=${settings.inviteToken}` 
    : 'Kein aktiver Link';

  return (
    <SettingsSection title="Mitspieler einladen" icon={Users} iconColor="brand" className="md:col-span-2 bg-gradient-to-br from-brand/10 to-transparent">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-black text-white uppercase italic">Sicherer Team-Beitrittslink</h4>
          <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed">
            Generiere einen Link mit Sicherheitstoken. Dieser Link ist aus Sicherheitsgründen 48 Stunden gültig. 
          </p>
          {settings.inviteToken && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest break-all">
                Aktiver Token: {settings.inviteToken} <br className="sm:hidden" /> 
                (Gültig bis: {new Date(settings.inviteTokenExpiresAt).toLocaleString('de-DE')})
              </span>
            </div>
          )}
        </div>
        <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 md:w-80">
            <input 
              readOnly
              value={inviteUrl}
              className="w-full bg-black/60 border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-bold text-zinc-400 outline-none"
            />
          </div>
          <div className="flex gap-2">
            {settings.inviteToken && (
              <Button 
                variant="primary" 
                size="lg"
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
      </div>
    </SettingsSection>
  );
};

export default InviteLinkSection;
