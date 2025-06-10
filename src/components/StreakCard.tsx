import React from "react";
import flame from '../components/icons image/flame.webp'

interface StreakCardProps {
  streakCount: number;
  penguinImg: string; // PNG path
}

const StreakCard: React.FC<StreakCardProps> = ({ streakCount, penguinImg }) => {
  // Determine gradient color based on penguin image
  const getBgGradient = () => {
    if (penguinImg.includes('angry.png')) return 'from-transparent to-orange-900';
    if (penguinImg.includes('cry.png')) return 'from-transparent to-slate-900';
    if (penguinImg.includes('happy.png')) return 'from-transparent to-green-900';
    if (penguinImg.includes('love.png')) return 'from-transparent to-pink-900';
    if (penguinImg.includes('more angry.png')) return 'from-transparent to-red-900';
    if (penguinImg.includes('more cry.png') || penguinImg.includes('more-cry.png')) return 'from-transparent to-zinc-900';
    if (penguinImg.includes('neutral.png')) return 'from-transparent to-blue-900';
    if (penguinImg.includes('sad.png')) return 'from-transparent to-gray-900';
    
    // Default fallback
    return 'from-transparent to-zinc-900';
  };
  return (
  <div
    className={`w-[100%] h-[100%] bg-gradient-to-b ${getBgGradient()} rounded-2xl p-4 flex flex-col justify-between items-center relative overflow-hidden`}
  >
    {/* Top Row: Streak Number & Label, Flame */}
    <div className="w-full flex gap-1 flex-row items-start justify-between">
      <div className="flex flex-col items-start gap-[2px]">
        <span className="text-xl font-bold text-[#ff2d55] leading-none font-sans tracking-tight">
          {streakCount}
          
        </span>
        <span className="text-white font-light text-xs leading-tight font-sans opacity-90 mt-[2px] tracking-wide drop-shadow-sm whitespace-pre-line">
          Streak<br />
        </span>
      </div>      
      {/* Flame icon with dynamic styling based on streak */}
      <div className={`mt-[2px] ${streakCount > 0 ? "drop-shadow-[0_0_6px_#ffb300]" : ""}`}>
        <img 
          src={flame} 
          className={`w-12 ${streakCount === 0 ? "filter grayscale opacity-50" : ""}`}
          alt="" 
        />
      </div>
    </div>
    {/* Penguin at bottom center */}    <img
      src={penguinImg}
      alt="penguin"
      className="w-[58%] object-contain absolute left-1/2 -bottom-[6px] -translate-x-1/2 pointer-events-none z-20"    
    />
  </div>
  );
};

export default StreakCard;
