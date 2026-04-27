import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isToday,
  startOfDay,
  isWithinInterval,
  getDay
} from 'date-fns';
import { de } from 'date-fns/locale';
import { Trophy, Dumbbell, Calendar as CalendarIcon } from 'lucide-react';

const CalendarGrid = ({ currentMonth, selectedDate, setSelectedDate, events, absences }) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const isDayAbsent = (day) => {
    return absences.some(abs => {
      if (abs.type === 'Einmalig') return isWithinInterval(startOfDay(day), { start: startOfDay(abs.start), end: startOfDay(abs.end) });
      if (abs.type === 'Wöchentlich') {
        const targetDay = abs.day === 7 ? 0 : abs.day;
        return getDay(day) === targetDay;
      }
      return false;
    });
  };

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const dayEvents = events.filter(e => isSameDay(new Date(e.date), cloneDay));
      const inMonth = isSameMonth(cloneDay, monthStart);
      const isSel = isSameDay(cloneDay, selectedDate);
      const isAb = isDayAbsent(cloneDay) && inMonth;

      days.push(
        <div 
          key={day.toString()} 
          className={`min-h-[80px] lg:min-h-[130px] p-2 lg:p-4 border-r border-b border-zinc-900 transition-all relative group 
            ${isSel ? 'bg-brand/5 ring-1 ring-inset ring-brand/20 z-10' : 'bg-transparent'} 
            hover:bg-zinc-900/30 cursor-pointer`}
          onClick={() => setSelectedDate(cloneDay)}
        >
          <div className={`flex flex-col h-full ${!inMonth ? 'opacity-5' : ''}`}>
            <div className="flex items-center justify-between mb-1 lg:mb-2">
              <span className={`text-[10px] lg:text-xs font-black ${isToday(cloneDay) ? 'bg-brand text-black w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-lg lg:rounded-xl shadow-[0_0_15px_rgba(132,204,22,0.3)]' : isSel ? 'text-brand' : 'text-zinc-600'}`}>
                {format(day, "d")}
              </span>
              {isAb && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            </div>
            <div className="flex flex-wrap gap-1 lg:space-y-1.5 lg:flex-col">
              {dayEvents.map((event, idx) => (
                <div key={idx} className={`w-full lg:px-2.5 lg:py-1.5 p-1 rounded-lg lg:rounded-xl border text-[8px] font-black uppercase tracking-tight flex items-center gap-1.5 overflow-hidden
                  ${event.type?.toUpperCase() === 'SPIEL' ? 'bg-red-500/10 border-red-500/10 text-red-400' : 
                    event.type?.toUpperCase() === 'TRAINING' ? 'bg-blue-500/10 border-blue-500/10 text-blue-400' : 
                    'bg-amber-500/10 border-amber-500/10 text-amber-400'}`}>
                  {event.type === 'Spiel' ? <Trophy size={10} className="shrink-0" /> : 
                   event.type === 'Training' ? <Dumbbell size={10} className="shrink-0" /> : 
                   <CalendarIcon size={10} className="shrink-0" />}
                  <span className="truncate hidden lg:block flex-1">{event.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
    days = [];
  }

  return <div className="flex-1 border-t border-zinc-900">{rows}</div>;
};

export default CalendarGrid;
