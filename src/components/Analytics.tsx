import React from 'react';
import { Flame, Trophy, Calendar, PieChart } from 'lucide-react';
import type { Analytics as AnalyticsType } from '../types';

interface AnalyticsProps {
  data: AnalyticsType;
}

export function Analytics({ data }: AnalyticsProps) {
  const metrics = [
    {
      icon: <Flame className="text-orange-500" size={20} />,
      label: 'Current Streak',
      value: `${data.currentStreak} days`,
    },
    {
      icon: <Trophy className="text-yellow-500" size={20} />,
      label: 'Longest Streak',
      value: `${data.longestStreak} days`,
    },
    {
      icon: <Calendar className="text-blue-500" size={20} />,
      label: 'Total Active Days',
      value: `${data.totalActiveDays} days`,
    },
    {
      icon: <PieChart className="text-green-500" size={20} />,
      label: 'Completion Rate',
      value: `${data.completionRate}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-3xl border-[1px] border-gray-200 dark:border-zinc-700 flex items-center gap-2"
        >
          {metric.icon}
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400 text-xs">{metric.label}</span>
            <span className="text-sm font-bold">{metric.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}