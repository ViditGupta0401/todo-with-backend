import React, { useState } from 'react';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, isSameDay, subMonths, addMonths } from 'date-fns';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
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

interface FutureEvent {
  id: string; // Add unique ID for each event
  date: string;
  title: string;
}

interface HeatmapProps {
  data: { [key: string]: number };
  dailyData: DailyData[];
  tasks: Task[];
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  futureEvents?: FutureEvent[];
  onFutureEventAdd?: (event: FutureEvent) => void;
  onFutureEventRemove?: (date: string) => void;
}

export const Heatmap: React.FC<HeatmapProps> = ({ 
  data, 
  dailyData, 
  tasks, 
  selectedDate = new Date(), 
  onDateChange,
  futureEvents = [],
  onFutureEventAdd,
  onFutureEventRemove
}) => {
  const [selectedDay, setSelectedDay] = useState<DailyData | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // State for future events management
  const [selectedFutureEvent, setSelectedFutureEvent] = useState<FutureEvent | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<FutureEvent[]>([]);
  const [eventTitleInput, setEventTitleInput] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // Load future events from localStorage if not provided via props
  const [localFutureEvents, setLocalFutureEvents] = useState<FutureEvent[]>(() => {
    const savedEvents = localStorage.getItem('todo-tracker-future-events');
    return savedEvents ? JSON.parse(savedEvents) : [];
  });

  // Use provided future events or local state if not provided
  const allFutureEvents = futureEvents.length > 0 ? futureEvents : localFutureEvents;

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
    if (count === 0) return 'bg-gray-700';
    if (count <= 1) return 'bg-green-900/80';
    if (count <= 2) return 'bg-green-800/80';
    if (count <= 3) return 'bg-green-700/80';
    if (count <= 4) return 'bg-green-600/80';
    if (count <= 5) return 'bg-green-500/70';
    if (count <= 6) return 'bg-green-400/60';
    return 'bg-green-300/80';
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

  const getEventsForDay = (day: string): FutureEvent[] => {
    return allFutureEvents.filter(event => event.date === day);
  };

  const handleAddEvent = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    // Check if it's a future date
    if (!isAfter(day, adjustedToday)) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
      errorMsg.textContent = 'Events can only be added to future dates';
      document.body.appendChild(errorMsg);
      
      setTimeout(() => {
        document.body.removeChild(errorMsg);
      }, 2000);
      return;
    }
    
    // Get all events for this day
    const eventsForDay = getEventsForDay(dayStr);
    setSelectedDateEvents(eventsForDay);
    
    setIsAddingEvent(true);
    setEventTitleInput('');
    setSelectedFutureEvent({ id: '', date: dayStr, title: '' });
  };

  const handleSaveEvent = () => {
    if (!selectedFutureEvent || !eventTitleInput.trim()) return;
    
    const newEvent: FutureEvent = {
      id: crypto.randomUUID(),
      date: selectedFutureEvent.date,
      title: eventTitleInput.trim()
    };
    
    // Use the callback if provided, otherwise manage locally
    if (onFutureEventAdd) {
      onFutureEventAdd(newEvent);
    } else {
      const updatedEvents = [...localFutureEvents, newEvent];
      setLocalFutureEvents(updatedEvents);
      
      // Also update the selected date events
      const updatedSelectedDateEvents = [...selectedDateEvents, newEvent];
      setSelectedDateEvents(updatedSelectedDateEvents);
      
      localStorage.setItem('todo-tracker-future-events', JSON.stringify(updatedEvents));
    }
    
    // After saving, don't close the modal but reset the input to allow adding more events
    setEventTitleInput('');
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
    successMsg.textContent = 'Event added successfully';
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
      document.body.removeChild(successMsg);
    }, 2000);
  };

  const handleRemoveEvent = (id: string) => {
    // Use the callback if provided, otherwise manage locally
    if (onFutureEventRemove) {
      onFutureEventRemove(id);
    } else {
      const updatedEvents = localFutureEvents.filter(event => event.id !== id);
      setLocalFutureEvents(updatedEvents);
      
      // Also update the selected date events
      const updatedSelectedDateEvents = selectedDateEvents.filter(event => event.id !== id);
      setSelectedDateEvents(updatedSelectedDateEvents);
      
      localStorage.setItem('todo-tracker-future-events', JSON.stringify(updatedEvents));
    }
    
    // If there are no more events for this day, close the modal
    if (selectedDateEvents.length <= 1) {
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
    return allFutureEvents.some(event => event.date === day);
  };

  const getFutureEventTitle = (day: string) => {
    const events = getEventsForDay(day);
    return events.map(event => event.title).join(', ');
  };

  return (
    <div className="mt-3 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-2 sm:mb-4">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-1 sm:p-1.5 md:p-2 hover:bg-gray-700 dark:hover:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
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
            className="p-1 sm:p-1.5 md:p-2 hover:bg-gray-700 dark:hover:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            title="Next month"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2  dark:bg-zinc-800 bg-zinc-100 rounded-full flex items-center justify-center transition-colors  dark:hover:bg-zinc-700 hover:bg-zinc-300"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? 
            <Sun size={16} className="text-yellow-400" /> : 
            <Moon size={16} className="text-blue-600" />
          }
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 w-full overflow-x-auto p-1 xs:p-2 sm:p-3 md:p-4 lg:p-6 rounded-xl sm:rounded-2xl bg-gray-200 dark:bg-zinc-900 shadow-2xl">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={day + index} className="text-center text-[8px]  xs:text-[10px] sm:text-xs text-orange-700/50 py-0.5 sm:py-1">
            {day}
          </div>
        ))}
        
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
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
                'aspect-square relative w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded md:rounded-xl transition-all cursor-pointer',
                getColor(taskCount),
                isToday && 'ring-1 sm:ring-2 ring-blue-500',
                isFuture && 'opacity-70',
                dayHasEvent && 'ring-2 ring-orange-500 hover:bg-orange-200/40 dark:hover:bg-orange-900/30',
                !dayHasEvent && 'hover:ring-1 sm:hover:ring-2 hover:ring-blue-500'
              )}
              style={{ opacity }}
              title={`${format(day, 'MMM d')}: ${taskCount} task${taskCount !== 1 ? 's' : ''} completed${dayHasEvent ? ` | Events: ${eventTitle}` : ''}`}
              onClick={() => {
                if (dayHasEvent) {
                  const events = getEventsForDay(dateStr);
                  setSelectedDateEvents(events);
                  setSelectedFutureEvent(events[0]);
                  setIsAddingEvent(false);
                } else if (isFuture) {
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
              <div className="flex items-center justify-center h-full text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-black dark:text-gray-300">
                {format(day, 'd')}
              </div>
              {dayHasRemark && (
                <div className="absolute top-0 right-0 w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full"></div>
              )}
              {dayHasEvent && (
                <div className="absolute bottom-0 right-0 w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for showing daily task information */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 p-4 sm:p-5 md:p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-700 max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
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
          <div className="bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 p-4 sm:p-5 md:p-6 rounded-3xl shadow-2xl border border-orange-300 dark:border-orange-700 max-w-md w-full">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                {isAddingEvent ? 'Add Event' : 'Future Events'}: {format(new Date(selectedFutureEvent.date), 'MMMM d, yyyy')}
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
              {isAddingEvent ? (
                <>
                  <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">Event Title</p>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-white rounded-xl text-xs sm:text-sm p-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-zinc-200 dark:border-zinc-600"
                      placeholder="Enter event title"
                      value={eventTitleInput}
                      onChange={(e) => setEventTitleInput(e.target.value)}
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleSaveEvent}
                        className="px-4 py-2 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors"
                        disabled={!eventTitleInput.trim()}
                      >
                        Add Event
                      </button>
                      <button
                        onClick={() => setSelectedFutureEvent(null)}
                        className="px-4 py-2 text-xs sm:text-sm bg-zinc-500 hover:bg-zinc-600 text-white rounded-xl transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  
                  {/* Show existing events for this day */}
                  {selectedDateEvents.length > 0 && (
                    <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">Existing Events</p>
                      <div className="space-y-2">
                        {selectedDateEvents.map(event => (
                          <div key={event.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl">
                            <span className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">{event.title}</span>
                            <button
                              onClick={() => handleRemoveEvent(event.id)}
                              className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-red-500"
                              title="Remove Event"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-white dark:bg-zinc-700 p-4 rounded-2xl shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-orange-500 rounded-full mr-2"></div>
                        <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">
                          Upcoming Events ({selectedDateEvents.length})
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsAddingEvent(true);
                          setEventTitleInput('');
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}