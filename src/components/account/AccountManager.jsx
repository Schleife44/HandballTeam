import React, { useState } from 'react';
import { 
  User, Mail, Lock, Shield, Trash2, 
  Check, XCircle, Camera, RefreshCw, LogOut 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const AccountManager = () => {
  const { user, profile, updateUserProfile, resetPassword, logout, uploadProfilePicture } = useStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = React.useRef(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return notify('Datei zu groß (max. 2MB)', 'error');
    }

    setIsUploading(true);
    const res = await uploadProfilePicture(file);
    setIsUploading(false);

    if (res.success) {
      notify('Profilbild aktualisiert');
    } else {
      notify('Upload fehlgeschlagen: ' + res.error, 'error');
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    const res = await updateUserProfile({ displayName });
    setIsSaving(false);
    
    if (res.success) {
      notify('Profil erfolgreich aktualisiert');
    } else {
      notify('Fehler: ' + res.error, 'error');
    }
  };

  const handlePasswordReset = async () => {
    const res = await resetPassword();
    if (res.success) {
      notify('Email zum Zurücksetzen wurde gesendet');
    } else {
      notify('Fehler: ' + res.error, 'error');
    }
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-100">Mein Account</h2>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Verwalte deine persönlichen Daten & Sicherheit</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Card */}
        <Card className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="w-24 h-24 rounded-[2rem] bg-brand flex items-center justify-center text-3xl font-black text-black shadow-2xl overflow-hidden relative">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.displayName?.charAt(0).toUpperCase() || '?'
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RefreshCw size={24} className="text-brand animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors shadow-xl opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <Camera size={16} />
              </button>
            </div>
            
            <div className="flex-1 space-y-4 w-full text-center md:text-left">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Vollständiger Name</label>
                <Input 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dein Name"
                  icon={User}
                  className="bg-black/40 border-zinc-800"
                />
              </div>
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <Button 
                  variant="primary" 
                  onClick={handleUpdateProfile}
                  isLoading={isSaving}
                  disabled={displayName === user?.displayName}
                >
                  Profil Speichern
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Card */}
        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-zinc-800 bg-zinc-950/20 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase italic">Sicherheit & Login</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Passwort und Authentifizierung</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-800 rounded-xl text-zinc-400">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">E-Mail Adresse</p>
                  <p className="text-sm font-bold text-white">{user?.email}</p>
                </div>
              </div>
              <span className="text-[9px] font-black text-brand uppercase tracking-widest bg-brand/10 px-3 py-1 rounded-full border border-brand/20">Verifiziert</span>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-800 rounded-xl text-zinc-400">
                  <Lock size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Passwort</p>
                  <p className="text-sm font-bold text-white">••••••••••••</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                icon={RefreshCw}
                onClick={handlePasswordReset}
              >
                Passwort zurücksetzen
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-8 border-red-500/20 bg-red-500/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-sm font-black text-red-500 uppercase italic flex items-center gap-2 justify-center md:justify-start">
                <Trash2 size={16} /> Gefahrzone
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-sm">
                Wenn du deinen Account löschst, gehen alle deine persönlichen Daten und Verknüpfungen unwiderruflich verloren.
              </p>
            </div>
            <Button 
              variant="danger" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              Account Löschen
            </Button>
          </div>
        </Card>

        <div className="flex justify-center pt-8">
           <Button 
             variant="ghost" 
             icon={LogOut}
             onClick={() => logout()}
             className="text-zinc-500 hover:text-red-500"
           >
             Von allen Geräten abmelden
           </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Account endgültig löschen?"
        footer={
          <div className="flex gap-4 w-full">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Abbrechen</Button>
            <Button variant="danger" className="flex-1">Unwiderruflich löschen</Button>
          </div>
        }
      >
        <div className="py-6 text-center space-y-4 text-zinc-400 text-sm leading-relaxed">
          Bist du sicher? Dieser Schritt kann nicht rückgängig gemacht werden. Alle deine Daten werden von unseren Servern entfernt.
        </div>
      </Modal>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-[100] border backdrop-blur-xl flex items-center gap-3
              ${notification.type === 'error' ? 'bg-red-500/90 border-red-500 text-white' : 'bg-zinc-900/90 border-brand/50 text-brand'}`}
          >
            {notification.type === 'error' ? <XCircle size={18} /> : <Check size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountManager;
