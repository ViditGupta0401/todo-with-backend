import React from "react";

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface LeetCodeStreakBarProps {
  streakDays: ('completed' | 'not-completed' | 'past-not-completed')[]; // Status for each day
}

const LeetCodeStreakBar: React.FC<LeetCodeStreakBarProps> = ({ streakDays }) => (
  <div className="bg-[#1e1e1e] rounded-2xl py-2 px-2  flex flex-row flex-nowrap gap-[6px] justify-center items-center min-w-[200px] ">
    {daysOfWeek.map((day, idx) => (
      <div key={day} className="flex flex-col items-center min-w-[18px]">
        <div
          className={`w-[clamp(14px,3vw,20px)] h-[clamp(14px,3vw,20px)] rounded-full flex items-center justify-center mb-[1px] transition-colors ${
            streakDays[idx] === 'completed' 
              ? "bg-[#ff2d55]" 
              : streakDays[idx] === 'past-not-completed'
                ? "bg-[#444444]" 
                : "bg-[#00000055]"
          }`}
        >
          {streakDays[idx] === 'completed' && (
            <svg width="0.7em" height="0.7em" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 8.5l3 3 5-5"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {streakDays[idx] === 'past-not-completed' && (
            <svg width="0.7em" height="0.7em" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8m0-8l-8 8"
                stroke="#aaa"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <span
          className="text-white text-[clamp(7px,1.5vw,10px)] tracking-wider font-inherit opacity-85 select-none"
        >
          {day}
        </span>
      </div>
    ))}
  </div>
);

export default LeetCodeStreakBar;
