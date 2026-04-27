import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

export default function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-black text-zinc-100 overflow-hidden relative">
      <Sidebar isSidebarOpen={isSidebarOpen} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pb-16 lg:pb-0">
        <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
