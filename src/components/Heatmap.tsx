import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, isSameDay, subMonths, addMonths } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { UpcomingEvent, EVENTS_STORAGE_KEY } from '../components/UpcomingEventsWidget';
import { usePopup } from '../context/PopupContext';
import { getEventsForDate, hasEvents } from '../utils/eventUtils';
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
  const { theme } = useTheme();
  const { openPopup } = usePopup();
  // Add eventVersion state to force re-render on event add/remove
  const [eventVersion, setEventVersion] = useState(0);

  // Listen for storage changes from other components to update the UI
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === EVENTS_STORAGE_KEY) {
        setEventVersion(v => v + 1); // force re-render
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper to trigger re-render after event add/remove in this tab
  const triggerEventUpdate = () => setEventVersion(v => v + 1);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  // Recompute days and event-related values when eventVersion changes
  const days = React.useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd, eventVersion]);

  // Use eventVersion in the render to force re-render when it changes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _forceRerender = eventVersion;

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
      // Open day details popup
      openPopup('dayDetails', {
        date: dayStr,
        dayData: dayData,
        tasks: tasks
      });
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
        // Open day details popup with placeholder data
        openPopup('dayDetails', {
          date: dayStr,
          dayData: placeholderData,
          tasks: tasks
        });
      }
    }
  };


  const hasRemark = (day: string) => {
    return dailyData.some(d => d.date === day && d.remark);
  };
  
  const handleAddEvent = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
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
    // Use the PopupContext to open the AddEventPopup, and trigger update after close
    openPopup('addEvent', {
      initialDate: dayStr,
      initialTime: '12:00',
      onEventAdded: triggerEventUpdate
    });
  };

  // Helper to get events for a day
  const getEventsForDay = (day: string) => {
    return getEventsForDate(day);
  };

  // Helper to check if a day has events
  const isFutureEvent = (day: string) => {
    return hasEvents(day);
  };

  // Helper to get event titles for a day
  const getFutureEventTitle = (day: string) => {
    const events = getEventsForDay(day);
    return events.map(event => event.title).join(', ');
  };

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
                title={`${format(day, 'MMM d')}: ${taskCount} task${taskCount !== 1 ? 's' : ''} completed${dayHasEvent ? ` | Events: ${eventTitle}` : ''}`}                onClick={() => {
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
                    // Open event details popup
                    openPopup('eventDetails', {
                      date: dateStr,
                      events: events,
                      onEventChanged: triggerEventUpdate
                    });
                  } else if (shouldShowEventAdder) {
                    handleAddEvent(day);
                  } else {
                    handleDayClick(day);
                  }
                }}                onContextMenu={(e) => {
                  e.preventDefault();
                  if (dayHasEvent) {
                    const events = getEventsForDay(dateStr);
                    // Open event details popup
                    openPopup('eventDetails', {
                      date: dateStr,
                      events: events,
                      onEventChanged: triggerEventUpdate
                    });
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
      </div>      {/* Modals have been moved to the Popup system */}
    </div>
  );
}
