import React, { useState, useEffect } from 'react';
import { Mail, Lock, LogIn, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';

export default function LoginView() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, loginWithGoogle, isAuthenticated } = useStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const res = isLogin 
      ? await login(email, password) 
      : await register(email, password);
      
    if (!res.success) {
      setError(res.error);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const res = await loginWithGoogle();
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand/5 blur-[120px] rounded-full animate-pulse delay-700" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 mb-6">
            <span className="text-brand text-xs font-bold tracking-[0.2em] uppercase italic">Handball Team Manager</span>
          </div>
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-2">
            SECHS<span className="text-brand">METER</span>
          </h1>
          <p className="text-zinc-500 text-sm">Die Zukunft des Handball-Managements.</p>
        </div>

        <div className="bg-zinc-950/50 backdrop-blur-xl border border-zinc-900 rounded-3xl p-8 shadow-2xl">
          <div className="flex bg-black/40 p-1 rounded-xl mb-8 border border-zinc-900">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Registrieren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand transition-colors" size={18} />
                <input 
                  type="email"
                  placeholder="Email Adresse"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-zinc-900 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-brand/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand transition-colors" size={18} />
                <input 
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-900 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-brand/50 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-bright text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
              <span className="uppercase italic tracking-tight">{isLogin ? 'Anmelden' : 'Konto erstellen'}</span>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-900"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase italic">
              <span className="bg-[#050505] px-4 text-zinc-600 font-bold tracking-widest">Oder weiter mit</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]"
          >
            <Globe size={20} />
            <span className="text-sm">Mit Google anmelden</span>
          </button>
        </div>

        <p className="text-center mt-8 text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold">
          &copy; 2026 Sechsmeter V2 &bull; Professional Handball Analytics
        </p>
      </div>
    </div>
  );
}
