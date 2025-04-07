import React, { useState } from 'react';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, isSameDay } from 'date-fns';
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
}

export const Heatmap: React.FC<HeatmapProps> = ({ data, dailyData, tasks }) => {
  const [selectedDay, setSelectedDay] = useState<DailyData | null>(null);

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

  // Get current month's days
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  // Get all days in the current month
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate max tasks in a day for opacity scaling
  const maxTasks = Math.max(...Object.values(data), 1);

  // Adjust today's date based on 5 AM boundary
  const adjustedToday = new Date(today);
  if (today.getHours() < 5) {
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
    <div className="mt-5">
      <h3 className="text-lg font-semibold mb-4">
        Activity for {format(today, 'MMMM yyyy')}
      </h3>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const taskCount = data[format(day, 'yyyy-MM-dd')] || 0;
          const opacity = taskCount > 0 ? (taskCount / maxTasks) * 0.8 + 0.2 : 0.2;
          const isToday = isSameDay(day, adjustedToday);
          const isFuture = isAfter(day, adjustedToday);
          
          return (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={clsx(
                'aspect-square w-10 h-10 rounded-md transition-all cursor-pointer hover:ring-2 hover:ring-blue-500',
                getColor(taskCount),
                isToday && 'ring-2 ring-blue-500',
                isFuture && 'opacity-50'
              )}
              style={{ opacity }}
              title={`${format(day, 'MMM d')}: ${taskCount} task${taskCount !== 1 ? 's' : ''} completed`}
              onClick={() => handleDayClick(day)}
            >
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for showing daily task information */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {format(new Date(selectedDay.date), 'MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round((selectedDay.completedTasks / selectedDay.totalTasks) * 100)}%
                </p>
              </div>
              
              <div>
                <p className="text-gray-400">Completed Tasks</p>
                <div className="mt-2 space-y-2">
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
                        <span>{task.text}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div>
                <p className="text-gray-400">Total Tasks</p>
                <p className="text-lg">{selectedDay.totalTasks}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}