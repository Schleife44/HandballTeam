import React from 'react';
import { Wallet, TrendingDown, TrendingUp, Plus } from 'lucide-react';
import Button from '../../ui/Button';

const FinesHeader = ({ canManageMoney, onOpenModal }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-[1.8rem] bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-xl shadow-brand/10">
          <Wallet size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
            Mannschaftskasse
          </h1>
          <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">
            Finanz- & Strafenmanagement
          </p>
        </div>
      </div>

      {canManageMoney && (
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenModal('expense')} 
            icon={TrendingDown} 
            className="text-red-500 border-red-500/20 hover:bg-red-500/10"
          >
            Ausgabe
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenModal('income')} 
            icon={TrendingUp} 
            className="text-blue-500 border-blue-500/20 hover:bg-blue-500/10"
          >
            Einnahme
          </Button>
          <Button 
            variant="primary" 
            onClick={() => onOpenModal('fine')} 
            icon={Plus}
          >
            Strafe
          </Button>
        </div>
      )}
    </div>
  );
};

export default FinesHeader;
