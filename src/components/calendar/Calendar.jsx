import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

// Hooks
import { useCalendarData } from '../../hooks/useCalendarData';
import { useEventEditor } from '../../hooks/useEventEditor';

// Sub-Components
import CalendarHeader from './parts/CalendarHeader';
import DayLabels from './parts/DayLabels';
import CalendarGrid from './parts/CalendarGrid';
import EventSidebar from './parts/EventSidebar';
import EventModal from './parts/EventModal';
import AbsenceModal from './parts/AbsenceModal';
import ManagementHub from './parts/ManagementHub';
import DeleteConfirmation from './parts/DeleteConfirmation';

const Calendar = () => {
  const {
    events, setEvents,
    absences, setAbsences,
    subscriptions,
    series, setSeries,
    settings,
    homeSquad,
    isSyncing,
    syncFromHnet,
    handleUpdateStatus,
    handleAddAbsence,
    executeDeletion,
    saveSeriesTitle,
    allMembers
  } = useCalendarData();

  // UI STATE
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [activeModal, setActiveModal] = useState(null); 
  const [confirmDelete, setConfirmDelete] = useState({ type: null, id: null, title: '' });
  const [editingSeriesId, setEditingSeriesId] = useState(null);
  const [tempSeriesTitle, setTempSeriesTitle] = useState('');

  // Specialized Hooks for Logic
  const {
    eventData,
    setEventData,
    handleSaveEvent,
    formError,
    setFormError,
    resetEventData
  } = useEventEditor(homeSquad, allMembers, setEvents, setSeries, setActiveModal);

  // Absence Form State (kept local as it's simple)
  const [absenceData, setAbsenceData] = useState({ 
    type: 'Einmalig', 
    start: format(new Date(), 'yyyy-MM-dd'), 
    end: format(new Date(), 'yyyy-MM-dd'), 
    day: 1, 
    reason: '' 
  });

  // Management Hub State
  const [newAbo, setNewAbo] = useState({ 
    url: '', isMandatory: false, isAutoGoing: false, deadline: 0, meetingOffset: 60 
  });

  useEffect(() => {
    setExpandedEventId(null);
    if (!eventData.id) {
      setEventData(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }));
    }
  }, [selectedDate, eventData.id, setEventData]);

  return (
    <>
      <div className="hub-card overflow-hidden flex flex-col lg:flex-row h-[calc(100vh-6rem)] lg:h-[calc(100vh-8rem)] min-h-[600px] border-zinc-900 bg-zinc-950/20 animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col border-r border-zinc-900 overflow-hidden">
           
           <CalendarHeader 
              currentMonth={currentMonth}
              onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
              onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
              onManage={() => setActiveModal('manage')}
              onAbsence={() => setActiveModal('absence')}
              onAddEvent={() => {
                resetEventData(selectedDate);
                setActiveModal('event');
              }}
           />

           <DayLabels />

          <div className="overflow-y-auto no-scrollbar relative flex-1 min-h-[400px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentMonth.toISOString()}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="w-full h-full flex flex-col"
              >
                <CalendarGrid 
                  currentMonth={currentMonth}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  events={events}
                  absences={absences}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="flex justify-center mt-6 pb-4">
            <p className="text-xs text-zinc-500 opacity-50 italic">
              Datenquelle: handball.net / DHB Pro Sync
            </p>
          </div>
        </div>

        <EventSidebar 
          selectedDate={selectedDate}
          events={events}
          expandedEventId={expandedEventId}
          setExpandedEventId={setExpandedEventId}
          handleUpdateStatus={handleUpdateStatus}
          setEventData={setEventData}
          setActiveModal={setActiveModal}
          setConfirmDelete={setConfirmDelete}
          settings={settings}
          setFormError={setFormError}
        />
      </div>

      {/* MODALS */}
      <EventModal 
        isOpen={activeModal === 'event'}
        onClose={() => setActiveModal(null)}
        eventData={eventData}
        setEventData={setEventData}
        handleSaveEvent={handleSaveEvent}
        selectedDate={selectedDate}
        formError={formError}
      />

      <AbsenceModal 
        isOpen={activeModal === 'absence'}
        onClose={() => setActiveModal(null)}
        absenceData={absenceData}
        setAbsenceData={setAbsenceData}
        handleAddAbsence={() => {
          handleAddAbsence(absenceData);
          setAbsenceData({ ...absenceData, reason: '' });
          setActiveModal(null);
        }}
        absences={absences}
        setAbsences={setAbsences}
      />

      <ManagementHub 
        isOpen={activeModal === 'manage'}
        onClose={() => setActiveModal(null)}
        newAbo={newAbo}
        setNewAbo={setNewAbo}
        handleImportICS={() => syncFromHnet(newAbo.meetingOffset)}
        isSyncing={isSyncing}
        subscriptions={subscriptions}
        series={series}
        editingSeriesId={editingSeriesId}
        setEditingSeriesId={setEditingSeriesId}
        tempSeriesTitle={tempSeriesTitle}
        setTempSeriesTitle={setTempSeriesTitle}
        saveSeriesTitle={(id) => saveSeriesTitle(id, tempSeriesTitle)}
        setConfirmDelete={setConfirmDelete}
      />

      <DeleteConfirmation 
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        executeDeletion={() => executeDeletion(confirmDelete.type, confirmDelete.id)}
      />
    </>
  );
};

export default Calendar;
