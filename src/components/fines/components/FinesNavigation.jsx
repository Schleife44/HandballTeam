import React from 'react';
import { Wallet, Receipt, Layers, Settings2, Users } from 'lucide-react';

const FinesNavigation = ({ activeTab, setActiveTab, canManageMoney }) => {
  const tabs = [
    { id: 'dashboard', label: 'Übersicht', icon: Wallet },
    { id: 'history', label: 'Schulden', icon: Receipt },
    { id: 'drinks', label: 'Sammelkosten', icon: Layers },
    { id: 'catalog', label: 'Strafenkatalog', icon: Settings2, restricted: true },
    { id: 'settings', label: 'Einstellungen', icon: Users, restricted: true }
  ];

  return (
    <div className="flex p-1.5 bg-zinc-900/40 rounded-[2rem] border border-zinc-800 backdrop-blur-xl w-fit overflow-x-auto no-scrollbar">
      {tabs.filter(tab => !tab.restricted || canManageMoney).map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-3 px-6 py-3.5 rounded-[1.6rem] text-xs font-black uppercase italic tracking-widest transition-all whitespace-nowrap ${
            activeTab === tab.id 
              ? 'bg-brand text-black shadow-lg shadow-brand/20' 
              : 'text-zinc-500 hover:text-zinc-200'
          }`}
        >
          <tab.icon size={16} />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default FinesNavigation;
