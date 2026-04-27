import React from 'react';
import Card from '../../ui/Card';

const DashboardCard = ({ children, title, icon: Icon, className = "" }) => (
  <Card noPadding className={`flex flex-col ${className}`}>
    {title && (
      <div className="px-8 py-5 border-b border-zinc-800/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-brand/10 rounded-xl text-brand">
              <Icon size={14} strokeWidth={3} />
            </div>
          )}
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{title}</h2>
        </div>
      </div>
    )}
    <div className="p-8 flex-1">
      {children}
    </div>
  </Card>
);

export default DashboardCard;
