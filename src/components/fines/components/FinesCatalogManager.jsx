import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Plus, Trash2 } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

const FinesCatalogManager = ({ 
  catalog, 
  onAddItem, 
  onRemoveItem, 
  formatCurrency 
}) => {
  const nameRef = useRef();
  const amountRef = useRef();

  const handleAdd = () => {
    const name = nameRef.current?.value;
    const amount = amountRef.current?.value;
    if (name && amount) {
      onAddItem(name, amount);
      nameRef.current.value = '';
      amountRef.current.value = '';
    }
  };

  return (
    <motion.div 
      key="catalog" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12"
    >
      <Card className="p-8" title="Aktiver Strafenkatalog" icon={Settings2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalog.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-zinc-900/40 border border-zinc-800 hover:border-brand/30 transition-all group">
              <div className="min-w-0">
                <p className="text-xs font-black text-zinc-100 uppercase italic truncate">{item.name}</p>
                <p className="text-[14px] font-black text-brand italic mt-1">{formatCurrency(item.amount)}</p>
              </div>
              <Button variant="ghost" size="icon" icon={Trash2} onClick={() => onRemoveItem(item.id)} className="text-zinc-500 hover:text-red-500" />
            </div>
          ))}
        </div>
      </Card>
      
      <Card className="p-8" title="Vorlage hinzufügen" icon={Plus}>
        <div className="space-y-4">
          <Input 
            label="Name der Strafe" 
            ref={nameRef}
            placeholder="z.B. Zu spät Training" 
          />
          <Input 
            label="Betrag (€)" 
            ref={amountRef}
            type="number" 
            placeholder="5.00" 
          />
          <Button 
            variant="primary" 
            className="w-full py-4 mt-4"
            onClick={handleAdd}
          >
            Vorlage Speichern
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default FinesCatalogManager;
