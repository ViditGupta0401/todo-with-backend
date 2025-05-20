import React, { useEffect, useState } from 'react';
import AnimatedCounter from './AnimatedCounter';

// Helper to get time left in week, month, year
function getTimeLeft() {
  const now = new Date();
  // Week
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Monday=1, Sunday=7
  const daysLeftWeek = 7 - dayOfWeek;
  // Month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftMonth = daysInMonth - now.getDate();
  // Year
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const daysInYear = (now.getFullYear() % 4 === 0 && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0)) ? 366 : 365;
  const daysLeftYear = daysInYear - dayOfYear;
  return { daysLeftWeek, daysLeftMonth, daysLeftYear, dayOfWeek, daysInMonth, dayOfYear, daysInYear };
}

function pad(n: number) {
  return n < 10 ? `0${n}` : n;
}

const weekColors = ['#c80046', '#c80046', '#c80046', '#c80046', '#c80046', '#c80046', '#c80046'];
const monthColor = '#7b1fff';
const yearColor = '#0096b3';

const ClockWidget: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  const { dayOfWeek, daysInMonth, dayOfYear, daysInYear } = getTimeLeft();
  // Progress
  const weekProgress = (dayOfWeek / 7) * 100;
  const monthProgress = (now.getDate() / daysInMonth) * 100;
  const yearProgress = (dayOfYear / daysInYear) * 100;
  // Format time as hh:mm:ss AM/PM
  const hours = now.getHours() % 12 || 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return (
    <div style={{ background: '#232226', borderRadius: '1.5rem',marginBottom: 18, padding: '1.45rem 1.2rem 0.95rem 1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 32px #0002', minWidth: 0, maxWidth: '100%', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        <AnimatedCounter
          value={timeString}
          className="text-[2.8rem] font-thin text-slate-100 tracking-wide flex items-center mb-2"
          separatorClassName="text-white/60 mx-1"
          digitClassName="text-slate-100/70"
          separators={[":"]}
        />
        <span className="text-sm text-slate-50/70 mb-1 ml-1" style={{marginBottom: 18}}>{ampm}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 2, marginBottom: 18, width: '100%', justifyContent: 'center' }}>
        {/* Week */}
        <div style={{ position: 'relative', width: 'fit-content', height: 32, display: 'flex', alignItems: 'center', overflow: 'hidden', borderRadius: 16 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: `${weekProgress}%`, height: '100%', background: weekColors[0], zIndex: 1, transition: 'width 0.5s' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: '#18181b', zIndex: 0, borderRadius: 16 }} />
          <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 400, letterSpacing: 1, padding: '0 8px' }}>
            {weekDays[dayOfWeek - 1]}
          </div>
        </div>
        {/* Month */}
        <div style={{ position: 'relative',minWidth:80, width: 'fit-content', height: 32, display: 'flex', alignItems: 'center', overflow: 'hidden', borderRadius: 16 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: `${monthProgress}%`, height: '100%', background: monthColor, zIndex: 1, transition: 'width 0.5s' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: '#18181b', zIndex: 0, borderRadius: 16 }} />
          <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 400, letterSpacing: 1, padding: '0 8px' }}>
            {months[now.getMonth()]} {now.getDate()}
          </div>
        </div>
        {/* Year */}
        <div style={{ position: 'relative', width: 80, height: 32, display: 'flex', alignItems: 'center', overflow: 'hidden', borderRadius: 16 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: `${yearProgress}%`, height: '100%', background: yearColor, zIndex: 1, transition: 'width 0.5s' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: '#18181b', zIndex: 0, borderRadius: 16 }} />
          <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 400, letterSpacing: 1, padding: '0 8px' }}>
            {now.getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockWidget;
