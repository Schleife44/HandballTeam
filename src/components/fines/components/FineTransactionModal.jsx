import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import Input from '../../ui/Input';

const FineTransactionModal = ({ 
  modalType, 
  onClose, 
  error, 
  roster, 
  catalog, 
  selectedPlayer, 
  setSelectedPlayer, 
  selectedFineId, 
  setSelectedFineId, 
  customAmount, 
  setCustomAmount, 
  customNote, 
  setCustomNote, 
  onSubmit, 
  formatCurrency 
}) => {
  return (
    <Modal
      isOpen={!!modalType}
      onClose={onClose}
      title={modalType === 'fine' ? 'Strafe vergeben' : modalType === 'income' ? 'Einnahme buchen' : 'Ausgabe buchen'}
      footer={
        <div className="flex flex-col gap-4 w-full">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-4">
            <Button variant="ghost" className="flex-1 py-4" onClick={onClose}>Abbrechen</Button>
            <Button variant="primary" className="flex-1 py-4" onClick={onSubmit}>Bestätigen</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 py-4">
        {modalType === 'fine' && (
          <>
            <Select 
              label="Spieler auswählen"
              value={selectedPlayer} 
              onChange={(e) => setSelectedPlayer(e.target.value)}
              options={[
                { value: '', label: 'Wähle einen Spieler...' },
                ...roster.map(p => ({ value: p.name, label: `${p.name} (#${p.number})` }))
              ]}
            />
            <Select 
              label="Grund (Vorlage)"
              value={selectedFineId} 
              onChange={(e) => setSelectedFineId(e.target.value)}
              options={[
                { value: '', label: 'Vorlage wählen...' },
                ...catalog.map(f => ({ value: f.id, label: `${f.name} (${formatCurrency(f.amount)})` })),
                { value: 'manual', label: 'Manuelle Buchung (Eigener Betrag)' }
              ]}
            />
          </>
        )}

        {(selectedFineId === 'manual' || modalType === 'income' || modalType === 'expense') && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
            <Input 
              label="Betrag (€)"
              type="number" 
              value={customAmount} 
              onChange={(e) => setCustomAmount(e.target.value)} 
            />
            <Input 
              label="Grund / Notiz"
              value={customNote} 
              onChange={(e) => setCustomNote(e.target.value)} 
            />
          </motion.div>
        )}
      </div>
    </Modal>
  );
};

export default FineTransactionModal;
