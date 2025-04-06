import React from 'react';
import { Flame, Trophy, Calendar, PieChart } from 'lucide-react';
import type { Analytics as AnalyticsType } from '../types';

interface AnalyticsProps {
  data: AnalyticsType;
}

export function Analytics({ data }: AnalyticsProps) {
  const metrics = [
    {
      icon: <Flame className="text-orange-500" size={24} />,
      label: 'Current Streak',
      value: `${data.currentStreak} days`,
    },
    {
      icon: <Trophy className="text-yellow-500" size={24} />,
      label: 'Longest Streak',
      value: `${data.longestStreak} days`,
    },
    {
      icon: <Calendar className="text-blue-500" size={24} />,
      label: 'Total Active Days',
      value: `${data.totalActiveDays} days`,
    },
    {
      icon: <PieChart className="text-green-500" size={24} />,
      label: 'Completion Rate',
      value: `${data.completionRate}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-gray-800 p-4 rounded-lg flex flex-col items-center justify-center gap-2"
        >
          {metric.icon}
          <span className="text-gray-400 text-sm">{metric.label}</span>
          <span className="text-xl font-bold">{metric.value}</span>
        </div>
      ))}
    </div>
  );
}