import React, { useState } from 'react';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, isSameDay, subMonths, addMonths } from 'date-fns';
import type { Task } from '../types';

interface DailyData {
  date: string;
  completedTasks: number;
  totalTasks: number;
  completedTaskIds: string[];
  repeatingTaskIds: string[];
  nonRepeatingTaskIds: string[];
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
    if (count <= 5) return 'bg-green-500/80';
    if (count <= 6) return 'bg-green-400/80';
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
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Heatmap</h3>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 md:p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Previous month"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm md:text-lg font-medium whitespace-nowrap">
            {format(selectedDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 md:p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Next month"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2 max-w-full overflow-x-auto pb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center  text-xs text-gray-500 py-1">
            {day}
          </div>
        ))}
        
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="  aspect-square" />
        ))}
        
        {days.map((day) => {
          const taskCount = data[format(day, 'yyyy-MM-dd')] || 0;
          const opacity = taskCount > 0 ? (taskCount / maxTasks) * 0.8 + 0.2 : 0.2;
          const isToday = isSameDay(day, adjustedToday);
          const isFuture = isAfter(day, adjustedToday);
          
          return (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={clsx(
                'aspect-square  w-8 h-8 md:w-10 md:h-10 rounded-md transition-all cursor-pointer hover:ring-2 hover:ring-blue-500',
                getColor(taskCount),
                isToday && 'ring-2 ring-blue-500',
                isFuture && 'opacity-50'
              )}
              style={{ opacity }}
              title={`${format(day, 'MMM d')}: ${taskCount} task${taskCount !== 1 ? 's' : ''} completed`}
              onClick={() => handleDayClick(day)}
            >
              <div className="flex  items-center justify-center h-full text-[10px] md:text-xs text-gray-400">
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for showing daily task information */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-semibold">
                {format(new Date(selectedDay.date), 'MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400">Completion Rate</p>
                <p className="text-xl md:text-2xl font-bold">
                  {Math.round((selectedDay.completedTasks / selectedDay.totalTasks) * 100)}%
                </p>
              </div>
              
              <div>
                <p className="text-gray-400">Completed Tasks</p>
                <div className="mt-2 space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                  {selectedDay.completedTaskIds.map(taskId => {
                    const task = tasks.find(t => t.id === taskId);
                    return task ? (
                      <div key={taskId} className="flex items-center gap-2">
                        <div className={clsx(
                          'w-2 h-2 rounded-full',
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        )} />
                        <span className="text-sm">{task.text}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div>
                <p className="text-gray-400">Total Tasks</p>
                <p className="text-base md:text-lg">{selectedDay.totalTasks}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}