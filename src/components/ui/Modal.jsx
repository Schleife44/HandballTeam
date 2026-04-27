import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  // Schließt das Modal bei Druck auf ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full lg:max-w-lg bg-zinc-950 border-t lg:border border-zinc-900 rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full lg:slide-in-from-bottom-8 lg:zoom-in-95 duration-500 transition-all ease-in-out flex flex-col max-h-[95vh] lg:max-h-[90vh]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 lg:px-8 py-4 lg:py-6 border-b border-zinc-900 shrink-0 bg-zinc-950/50 backdrop-blur-md z-10">
          <h2 className="text-lg lg:text-xl font-black tracking-tight uppercase italic text-zinc-100">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-900 rounded-xl transition-all text-zinc-500 hover:text-zinc-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5">
          {children}
        </div>

        {/* Optional Fixed Footer */}
        {footer && (
          <div className="px-6 lg:px-8 py-4 lg:py-6 border-t border-zinc-900 bg-zinc-950/50 backdrop-blur-md shrink-0 z-10 pb-8 lg:pb-6">
            {footer}
          </div>
        )}
      </div>
    </div>
);
};

export default Modal;
