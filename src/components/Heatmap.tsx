import React from 'react';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, isSameDay } from 'date-fns';

interface HeatmapProps {
  data: { [key: string]: number };
}

export function Heatmap({ data }: HeatmapProps) {
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
            >
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>
      {/* <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((count) => (
            <div
              key={count}
              className={clsx('w-4 h-4 rounded', getColor(count))}
            />
          ))}
        </div>
        <span>More</span>
      </div> */}
    </div>
  );
}