import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import SyncStatusBanner from '../ui/SyncStatusBanner';

export default function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-black text-zinc-100 overflow-hidden relative">
      {/* Dynamic Background with more subtle gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black opacity-80 pointer-events-none" />
      <Sidebar isSidebarOpen={isSidebarOpen} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden no-scrollbar pb-16 lg:pb-0">
        <SyncStatusBanner />
        <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
