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

interface HeatmapProps {
  data: { [key: string]: number };
  dailyData: DailyData[];
  tasks: Task[];
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export const Heatmap: React.FC<HeatmapProps> = ({ data, dailyData, tasks, selectedDate = new Date(), onDateChange }) => {
  const [selectedDay, setSelectedDay] = useState<DailyData | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const { theme, toggleTheme } = useTheme();

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

  const hasRemark = (day: string) => {
    return dailyData.some(d => d.date === day && d.remark);
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
          
          return (
            <div
              key={dateStr}
              className={clsx(
                'aspect-square relative w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded md:rounded-xl transition-all cursor-pointer hover:ring-1  sm:hover:ring-2 hover:ring-blue-500',
                getColor(taskCount),
                isToday && 'ring-1 sm:ring-2 ring-blue-500',
                isFuture && 'opacity-50  '
              )}
              style={{ opacity }}
              title={`${format(day, 'MMM d')}: ${taskCount} task${taskCount !== 1 ? 's' : ''} completed`}
              onClick={() => handleDayClick(day)}
            >
              <div className="flex items-center justify-center h-full text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-black dark:text-gray-300">
                {format(day, 'd')}
              </div>
              {dayHasRemark && (
                <div className="absolute top-0 right-0 w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for showing daily task information */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-2 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold">
                {format(new Date(selectedDay.date), 'MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Completion Rate (All Tasks)</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">
                  {selectedDay.totalTasks > 0 
                    ? Math.round((selectedDay.completedTasks / selectedDay.totalTasks) * 100)
                    : 0}%
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  ({selectedDay.completedTasks} / {selectedDay.totalTasks})
                </p>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Completion Rate (Non-Repeating)</p>
                <p className="text-base sm:text-lg font-bold">
                  {selectedDay.nonRepeatingTaskIds.length > 0 
                    ? Math.round((selectedDay.completedTaskIds.filter(id => 
                        selectedDay.nonRepeatingTaskIds.includes(id)).length / 
                        selectedDay.nonRepeatingTaskIds.length) * 100)
                    : 0}%
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  ({selectedDay.completedTaskIds.filter(id => selectedDay.nonRepeatingTaskIds.includes(id)).length} / {selectedDay.nonRepeatingTaskIds.length})
                </p>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Completed Tasks</p>
                <div className="mt-1 sm:mt-2 space-y-1.5 sm:space-y-2 max-h-[30vh] sm:max-h-[40vh] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                  {selectedDay.completedTaskIds.map(taskId => {
                    // First check if task exists in the current tasks list
                    const task = tasks.find(t => t.id === taskId);
                    
                    // If task exists in current list, display it
                    if (task) {
                      return (
                        <div key={taskId} className="flex items-center gap-1.5 sm:gap-2">
                          <div className={clsx(
                            'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full',
                            task.priority === 'high' ? 'bg-red-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          )} />
                          <span className="text-xs sm:text-sm">{task.text}</span>
                        </div>
                      );
                    } 
                    
                    // If task doesn't exist in current list but exists in completedTaskTexts, display from there
                    const deletedTask = selectedDay.completedTaskTexts?.find(t => t.id === taskId);
                    if (deletedTask) {
                      return (
                        <div key={taskId} className="flex items-center gap-1.5 sm:gap-2">
                          <div className={clsx(
                            'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full',
                            deletedTask.priority === 'high' ? 'bg-red-500' :
                            deletedTask.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          )} />
                          <span className="text-xs sm:text-sm">{deletedTask.text}</span>
                        </div>
                      );
                    }
                    
                    return null;
                  })}
                </div>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
                <p className="text-sm sm:text-base md:text-lg">{selectedDay.totalTasks}</p>
              </div>

              {/* Remark section */}
              <div className="mt-3 sm:mt-4 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Remark</p>
                <textarea 
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded text-xs sm:text-sm p-2 sm:p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a remark for this day"
                  rows={3}
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                ></textarea>
                <button
                  onClick={handleRemarkSave}
                  className="mt-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Save Remark
                </button>
              </div>

              {/* Display existing remark */}
              {selectedDay.remark && (
                <div className="mt-2 p-2 sm:p-3 bg-gray-100/50 dark:bg-gray-700/50 rounded">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">{selectedDay.remark}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}