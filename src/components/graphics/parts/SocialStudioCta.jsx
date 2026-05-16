import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import Button from '../../ui/Button';

const SocialStudioCta = ({ canManageSocial, onClick }) => {
  return (
    <div 
      onClick={() => canManageSocial ? onClick() : null}
      className={`group relative rounded-[3.5rem] overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-16 transition-all shadow-2xl
        ${canManageSocial ? 'hover:border-brand/40 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
    >
      <motion.div 
        initial={{ x: 60, y: 60, scale: 0.8, opacity: 0, rotate: 20 }}
        animate={{ x: 0, y: 0, scale: 1.1, opacity: 1, rotate: 12 }}
        transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.05 }}
        className={`absolute -right-10 -bottom-10 transition-all duration-700 pointer-events-none
          ${canManageSocial ? 'text-brand/5 group-hover:text-brand/10 group-hover:rotate-6 group-hover:scale-[1.15]' : 'text-zinc-800'}`}
      >
        <ImageIcon size={280} fill="currentColor" />
      </motion.div>

      <div className="relative z-10 space-y-10 max-w-lg">
        <div>
          <h2 className="text-6xl font-black text-white uppercase italic leading-[0.95] tracking-tighter">
            Erstelle deine <br />
            <span className={canManageSocial ? 'text-brand' : 'text-zinc-600'}>Match-Grafik</span>
          </h2>
          <p className="text-sm font-bold text-zinc-500 mt-6 leading-relaxed">
            {canManageSocial 
              ? 'Nutze das Premium-Studio, um professionelle Instagram-Beiträge mit deinem Team-Design zu generieren.'
              : 'Nur der Pressewart oder der Super-Admin können Grafiken im Studio erstellen.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant={canManageSocial ? 'brand' : 'ghost'}
            className="px-10 py-6 rounded-[2.5rem] text-sm group pointer-events-none"
            disabled={!canManageSocial}
          >
            <ImageIcon size={20} strokeWidth={3} className="mr-2 group-hover:scale-110 transition-transform" /> 
            {canManageSocial ? 'Studio öffnen' : 'Zugriff verweigert'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SocialStudioCta;
