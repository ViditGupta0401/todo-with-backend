import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, isSameDay, subMonths, addMonths } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { UpcomingEvent, EVENTS_STORAGE_KEY } from '../components/UpcomingEventsWidget';
import { usePopup } from '../context/PopupContext';
import { getAllEvents, getEventsForDate, deleteEvent, hasEvents } from '../utils/eventUtils';
import type { Task } from '../types';

interface DailyData {
  date: string;
  completedTasks: number;
  totalTasks: number;
  completedTaskIds: string[];
  repeatingTaskIds: string[];
  nonRepeatingTaskIds: string[];
  completedTaskTexts?: { id: string; text: string; priority: 'high' | 'medium' | 'low' }[];
  remark?: string;
}

interface HeatmapProps {
  data: { [key: string]: number };
  dailyData: DailyData[];
  tasks: Task[];
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export const Heatmap: React.FC<HeatmapProps> = ({ 
  data, 
  dailyData, 
  tasks, 
  selectedDate = new Date(), 
  onDateChange
}) => {  
  const [selectedDay, setSelectedDay] = useState<DailyData | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const { theme } = useTheme();
  const { openPopup } = usePopup();
  
  // State for future events management
  const [selectedFutureEvent, setSelectedFutureEvent] = useState<UpcomingEvent | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<UpcomingEvent[]>([]);
  
  // State for keeping track of all events
  const [events, setEvents] = useState<UpcomingEvent[]>(() => getAllEvents());
  
  // Listen for storage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === EVENTS_STORAGE_KEY) {
        setEvents(getAllEvents());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => {
    onDateChange?.(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange?.(addMonths(selectedDate, 1));
  };

  const getColor = (count: number) => {
    if (theme === 'light') {
      // Light theme colors with better contrast
      if (count === 0) return 'bg-gray-200';
      if (count <= 1) return 'bg-green-200';
      if (count <= 2) return 'bg-green-300';
      if (count <= 3) return 'bg-green-400';
      if (count <= 4) return 'bg-green-500';
      if (count <= 5) return 'bg-green-600';
      if (count <= 6) return 'bg-green-700';
      return 'bg-green-800';
    } else {
      // Dark theme colors (unchanged)
      if (count === 0) return 'bg-gray-700';
      if (count <= 1) return 'bg-green-900/80';
      if (count <= 2) return 'bg-green-800/80';
      if (count <= 3) return 'bg-green-700/80';
      if (count <= 4) return 'bg-green-600/80';
      if (count <= 5) return 'bg-green-500/70';
      if (count <= 6) return 'bg-green-400/60';
      return 'bg-green-300/80';
    }
  };

  // Calculate max tasks in a day for opacity scaling
  const maxTasks = Math.max(...Object.values(data), 1);

  // Adjust today's date based on 5 AM boundary
  const adjustedToday = new Date(selectedDate);
  if (selectedDate.getHours() < 5) {
    adjustedToday.setDate(adjustedToday.getDate() - 1);
  }

  const handleDayClick = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayData = dailyData.find(d => d.date === dayStr);
    if (dayData) {
      setSelectedDay(dayData);
      setRemarkInput(dayData.remark || '');
    } else {
      // Create a placeholder for past days that don't have data
      const isPastDay = !isAfter(day, adjustedToday) && !isSameDay(day, adjustedToday);
      if (isPastDay) {
        const placeholderData: DailyData = {
          date: dayStr,
          completedTasks: 0,
          totalTasks: 0,
          completedTaskIds: [],
          repeatingTaskIds: [],
          nonRepeatingTaskIds: [],
          completedTaskTexts: []
        };
        setSelectedDay(placeholderData);
        setRemarkInput('');
      }
    }
  };

  const handleRemarkSave = () => {
    if (!selectedDay) return;
    
    // Find the index of the selected day in the dailyData array
    const dayIndex = dailyData.findIndex(d => d.date === selectedDay.date);
    
    if (dayIndex >= 0) {
      // Create a new array with the updated day data
      const updatedDailyData = [...dailyData];
      updatedDailyData[dayIndex] = {
        ...selectedDay,
        remark: remarkInput.trim() || undefined // Remove empty strings
      };
      
      // Save to localStorage
      try {
        localStorage.setItem('todo-tracker-daily-data', JSON.stringify(updatedDailyData));
        
        // Update the selectedDay state to reflect the change
        setSelectedDay({
          ...selectedDay,
          remark: remarkInput.trim() || undefined
        });
        
        // Show a brief success message or feedback
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
        successMsg.textContent = 'Remark saved successfully';
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 2000);
      } catch (error) {
        console.error('Error saving remark:', error);
      }
    }
  };

  const handleEditRemark = () => {
    setIsEditingRemark(true);
  };

  const hasRemark = (day: string) => {
    return dailyData.some(d => d.date === day && d.remark);
  };
  
  const getEventsForDay = (day: string): UpcomingEvent[] => {
    return getEventsForDate(day);
  };

  const handleAddEvent = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    // Check if it's a future date compared to the current real date, not just the selected month's date
    const currentDate = new Date();
    if (!isAfter(day, currentDate)) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
      errorMsg.textContent = 'Events can only be added to future dates';
      document.body.appendChild(errorMsg);
      
      setTimeout(() => {
        document.body.removeChild(errorMsg);
      }, 2000);
      return;
    }
    
    // Use the PopupContext to open the AddEventPopup instead of managing locally
    openPopup('addEvent', {
      initialDate: dayStr,
      initialTime: '12:00'
    });
  };
  
  const handleRemoveEvent = (id: string) => {
    // Delete the event using our utility function
    deleteEvent(id);
    
    // Update local state
    setEvents(getAllEvents());
    const updatedSelectedDateEvents = selectedDateEvents.filter(event => event.id !== id);
    setSelectedDateEvents(updatedSelectedDateEvents);
    
    // If there are no more events for this day, close the modal
    if (updatedSelectedDateEvents.length === 0) {
      setSelectedFutureEvent(null);
    }
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
    successMsg.textContent = 'Event removed successfully';
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
      document.body.removeChild(successMsg);
    }, 2000);
  };

  const isFutureEvent = (day: string) => {
    return hasEvents(day);
  };

  const getFutureEventTitle = (day: string) => {
    const events = getEventsForDay(day);
    return events.map(event => event.title).join(', ');
  };
  
  // Refs for modal click-outside handling
  const modalRef = React.useRef<HTMLDivElement>(null);
  const eventModalRef = React.useRef<HTMLDivElement>(null);

  const handleOutsideClick = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setSelectedDay(null);
    }
    
    if (eventModalRef.current && !eventModalRef.current.contains(e.target as Node)) {
      setSelectedFutureEvent(null);
    }
  };
  
  // Refresh events when the component mounts
  useEffect(() => {
    setEvents(getAllEvents());
  }, []);

  React.useEffect(() => {
    if (selectedDay || selectedFutureEvent) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [selectedDay, selectedFutureEvent]);

  return (
    <div className="mt-3 flex flex-col items-center">
      <div className="flex items-center justify-center w-full mb-2 sm:mb-4">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-1 sm:p-1.5 md:p-2 dark:hover:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            title="Previous month"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 dark:text-zinc-500 font-medium whitespace-nowrap">
            {format(selectedDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 sm:p-1.5 md:p-2 dark:hover:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            title="Next month"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Responsive calendar grid container */}
      <div
        className="w-full bg-zinc-900 pb-4 rounded-2xl max-w-[420px] min-w-[252px] overflow-x-auto px-1 xs:px-2 sm:px-3 md:px-4 lg:px-6 mb-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '0.25rem',
            gridAutoRows: '1fr',
          }}
        >
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div
              key={day + index}
              className="text-center text-[10px] xs:text-xs sm:text-sm text-orange-700/50 py-1 sm:py-1.5 md:py-2 font-semibold select-none"
              style={{ minWidth: 0 }}
            >
              {day}
            </div>
          ))}
        </div>
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '0.25rem',
            gridAutoRows: '1fr',
          }}
        >
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} style={{ aspectRatio: '1 / 1', minWidth: 0, width: '100%' }} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const taskCount = data[dateStr] || 0;
            const opacity = taskCount > 0 ? (taskCount / maxTasks) * 0.8 + 0.2 : 0.2;
            const isToday = isSameDay(day, adjustedToday);
            const isFuture = isAfter(day, adjustedToday);
            const dayHasRemark = hasRemark(dateStr);
            const dayHasEvent = isFutureEvent(dateStr);
            const eventTitle = getFutureEventTitle(dateStr);

            return (
              <div
                key={dateStr}
                className={clsx(
                  'relative rounded-lg font-thin  transition-all cursor-pointer flex items-center justify-center',
                  'hover:ring-1 sm:hover:ring-2 hover:ring-blue-500',
                  getColor(taskCount),
                  isToday && 'ring-1 sm:ring-2 ring-blue-500',
                  isFuture && theme === 'light' ? 'opacity-90' : isFuture && 'opacity-70',
                  dayHasEvent && theme === 'light'
                    ? 'ring-2 ring-orange-600 hover:bg-orange-100 hover:bg-opacity-60'
                    : dayHasEvent && 'ring-2 ring-orange-500 hover:bg-orange-900/30',
                )}
                style={{
                  opacity,
                  aspectRatio: '1 / 1',
                  minWidth: 0,
                  width: '100%',
                  maxWidth: '100%',
                  height: 'auto',
                  fontSize: 'clamp(10px, 2vw, 16px)',
                  padding: '0.2rem',
                }}
                title={`${format(day, 'MMM d')}: ${taskCount} task${taskCount !== 1 ? 's' : ''} completed${dayHasEvent ? ` | Events: ${eventTitle}` : ''}`}
                onClick={() => {
                  // Compare with the actual current date, not the adjusted one
                  const today = new Date();
                  // Check if the day is in the future (after today)
                  const isReallyFuture = isAfter(day, today);
                  // Check if the day is the same month but next year (future)
                  const isSameMonthNextYear = day.getMonth() === today.getMonth() && day.getFullYear() > today.getFullYear();
                  // Check if day is in a future month of current year
                  const isFutureMonth = day.getFullYear() === today.getFullYear() && day.getMonth() > today.getMonth();
                  
                  const shouldShowEventAdder = isReallyFuture || isSameMonthNextYear || isFutureMonth;
                  
                  if (dayHasEvent) {
                    const events = getEventsForDay(dateStr);
                    setSelectedDateEvents(events);
                    setSelectedFutureEvent(events[0]);
                  } else if (shouldShowEventAdder) {
                    handleAddEvent(day);
                  } else {
                    handleDayClick(day);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (dayHasEvent) {
                    const events = getEventsForDay(dateStr);
                    setSelectedDateEvents(events);
                    setSelectedFutureEvent(events[0]);
                  } else if (isFuture) {
                    handleAddEvent(day);
                  }
                }}
              >
                <div
                  className={clsx(
                    'flex items-center justify-center h-full w-full',
                    theme === 'light'
                      ? taskCount > 3 ? 'text-white' : 'text-gray-800'
                      : 'text-gray-300',
                    'font-light',
                  )}
                  style={{ fontSize: 'clamp(8px, 1.2vw, 12px)' }}
                >
                  {format(day, 'd')}
                </div>
                {dayHasRemark && (
                  <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full shadow" />
                )}
                {dayHasEvent && (
                  <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full shadow" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for showing daily task information */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div ref={modalRef} className="bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 p-4 sm:p-5 md:p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-700 max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                {format(new Date(selectedDay.date), 'MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300">All Tasks</p>
                  <p className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedDay.totalTasks > 0 
                      ? Math.round((selectedDay.completedTasks / selectedDay.totalTasks) * 100)
                      : 0}%
                  </p>
                  <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                    ({selectedDay.completedTasks} / {selectedDay.totalTasks})
                  </p>
                </div>
                
                <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300">Non-Repeating</p>
                  <p className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedDay.nonRepeatingTaskIds.length > 0 
                      ? Math.round((selectedDay.completedTaskIds.filter(id => 
                          selectedDay.nonRepeatingTaskIds.includes(id)).length / 
                          selectedDay.nonRepeatingTaskIds.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                    ({selectedDay.completedTaskIds.filter(id => selectedDay.nonRepeatingTaskIds.includes(id)).length} / {selectedDay.nonRepeatingTaskIds.length})
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">Completed Tasks</p>
                <div className="mt-1 sm:mt-2 space-y-1.5 sm:space-y-2">
                  {selectedDay.completedTaskIds.map(taskId => {
                    // First check if task exists in the current tasks list
                    const task = tasks.find(t => t.id === taskId);
                    
                    // If task exists in current list, display it
                    if (task) {
                      return (
                        <div key={taskId} className="flex items-center gap-1.5 sm:gap-2 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl">
                          <div className={clsx(
                            'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full',
                            task.priority === 'high' ? 'bg-red-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          )} />
                          <span className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">{task.text}</span>
                        </div>
                      );
                    } 
                    
                    // If task doesn't exist in current list but exists in completedTaskTexts, display from there
                    const deletedTask = selectedDay.completedTaskTexts?.find(t => t.id === taskId);
                    if (deletedTask) {
                      return (
                        <div key={taskId} className="flex items-center gap-1.5 sm:gap-2 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl">
                          <div className={clsx(
                            'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full',
                            deletedTask.priority === 'high' ? 'bg-red-500' :
                            deletedTask.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          )} />
                          <span className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">{deletedTask.text}</span>
                        </div>
                      );
                    }
                    
                    return null;
                  })}
                </div>
              </div>
              
              {/* Remark section */}
              <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">Remark</p>
                {isEditingRemark || !selectedDay.remark ? (
                  <>
                    <textarea 
                      className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-white rounded-xl text-xs sm:text-sm p-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-zinc-200 dark:border-zinc-600"
                      placeholder="Add a remark for this day"
                      rows={3}
                      value={remarkInput}
                      onChange={(e) => setRemarkInput(e.target.value)}
                    ></textarea>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRemarkSave}
                        className="mt-2 px-4 py-2 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors"
                      >
                        Save Remark
                      </button>
                      {isEditingRemark && (
                        <button
                          onClick={() => {
                            setIsEditingRemark(false);
                            setRemarkInput('');
                          }}
                          className="mt-2 px-4 py-2 text-xs sm:text-sm bg-zinc-500 hover:bg-zinc-600 text-white rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <div className="flex justify-between items-center">
                      <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200">{selectedDay.remark}</p>
                      <button
                        onClick={handleEditRemark}
                        className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-orange-600 dark:text-orange-400 transition-colors ml-2"
                        title="Edit Remark"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for future events */}
      {selectedFutureEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div ref={eventModalRef} className="bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 p-4 sm:p-5 md:p-6 rounded-3xl shadow-2xl border border-orange-300 dark:border-orange-700 max-w-md w-full">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                Events: {format(new Date(selectedFutureEvent.date), 'MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedFutureEvent(null)}
                className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-700 p-4 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-orange-500 rounded-full mr-2"></div>
                    <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">
                      Events ({selectedDateEvents.length})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Open the add event popup with this date
                      const dayStr = selectedFutureEvent.date;
                      openPopup('addEvent', {
                        initialDate: dayStr,
                        initialTime: '12:00'
                      });
                      
                      // Close this modal
                      setSelectedFutureEvent(null);
                    }}
                    className="p-1.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-500/30"
                    title="Add Event"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl">
                      <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-medium mb-1">
                        {event.title}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <button
                          onClick={() => handleRemoveEvent(event.id)}
                          className="p-1.5 text-xs sm:text-sm text-red-600 hover:text-red-700 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
