import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, to, badge, isSidebarOpen }) => {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        w-full flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} px-3 py-2.5 rounded-xl transition-all duration-300 group
        ${isActive 
          ? 'bg-brand text-black font-bold shadow-[0_10px_25px_-5px_rgba(132,204,22,0.4)] scale-[1.02]' 
          : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50 hover:scale-[1.03]'}
      `}
    >
      {({ isActive }) => (
        <>
          <div className={`flex items-center ${isSidebarOpen ? 'gap-2.5' : ''}`}>
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`flex-shrink-0 transition-transform duration-300 ${!isActive && 'group-hover:scale-110'}`} />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -10, width: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-xs tracking-tight whitespace-nowrap overflow-hidden"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {badge && isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0
                  ${isActive ? 'bg-black text-brand' : 'bg-brand text-black shadow-[0_0_10px_rgba(132,204,22,0.3)]'}`}
              >
                {badge}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );
};

export default SidebarItem;
