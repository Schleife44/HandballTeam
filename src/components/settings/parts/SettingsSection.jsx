import React from 'react';

const SettingsSection = ({ title, icon: Icon, iconColor = "brand", children, className = "" }) => (
  <section className={`bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-md space-y-8 ${className}`}>
    <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
      <div className={`p-2 rounded-xl ${
        iconColor === 'brand' ? 'bg-brand/10 text-brand' : 
        iconColor === 'blue' ? 'bg-blue-500/10 text-blue-500' : 
        iconColor === 'red' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-700/20 text-zinc-400'
      }`}>
        <Icon size={20} />
      </div>
      <h3 className="text-sm font-black uppercase italic text-zinc-100">{title}</h3>
    </div>
    {children}
  </section>
);

export default SettingsSection;
