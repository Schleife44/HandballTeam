import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Settings,
  UserX
} from 'lucide-react';
import Button from '../../ui/Button';

const CalendarHeader = ({ 
  currentMonth, 
  onPrevMonth, 
  onNextMonth, 
  onManage, 
  onAbsence, 
  onAddEvent 
}) => (
  <div className="flex flex-col lg:flex-row items-center justify-between px-4 lg:px-6 py-4 lg:py-6 border-b border-zinc-900 bg-zinc-950/20 gap-4">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-brand/10 border border-brand/20 rounded-2xl">
        <CalendarIcon size={20} className="text-brand" />
      </div>
      <div>
        <h2 className="text-xl font-black tracking-tighter uppercase italic text-zinc-100">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </h2>
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Saison 2025/26</p>
      </div>
    </div>
    
    <div className="flex items-center gap-2">
      <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 mr-2">
        <Button variant="ghost" size="icon" onClick={onPrevMonth} icon={ChevronLeft} className="text-zinc-400" />
        <Button variant="ghost" size="icon" onClick={onNextMonth} icon={ChevronRight} className="text-zinc-400" />
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onManage} 
          icon={Settings}
        />
        <Button 
          variant="outline" 
          onClick={onAbsence} 
          icon={UserX}
          className="text-[10px]"
        >
          Abwesenheit
        </Button>
        <Button 
          variant="primary" 
          onClick={onAddEvent} 
          icon={Plus}
          className="text-[10px]"
        >
          Event
        </Button>
      </div>
    </div>
  </div>
);

export default CalendarHeader;
