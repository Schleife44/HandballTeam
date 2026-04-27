import React from 'react';
import { Globe } from 'lucide-react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Badge from '../../ui/Badge';

const ImportModal = ({ isOpen, onClose, url, onUrlChange, status, onImport }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Spiel importieren"
    >
      <div className="flex flex-col gap-6">
        <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-brand/10 rounded-xl mt-1">
            <Globe size={20} className="text-brand" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-100 uppercase tracking-tight">Handball.net Spielbericht</p>
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-1">
              Füge den Link zum offiziellen Spielbericht ein, um alle Daten automatisch zu laden.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input 
            label="Spielbericht URL"
            placeholder="https://www.handball.net/spiele/..."
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
          />

          {status.message && (
            <Badge 
              variant={status.type === 'error' ? 'danger' : status.type === 'success' ? 'brand' : 'outline'}
              className="w-full py-3 justify-center text-[10px]"
            >
              {status.message}
            </Badge>
          )}

          <Button 
            variant="primary"
            className="w-full py-4 mt-2"
            onClick={onImport}
            disabled={!url || status.type === 'loading'}
          >
            Jetzt Importieren
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportModal;
