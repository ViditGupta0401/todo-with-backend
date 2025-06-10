import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface PomodoroWidgetProps {
  className?: string;
}

const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({ className }) => {
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('../workers/pomodoroWorker.ts', import.meta.url));

    // Handle messages from worker
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      
      switch (type) {
        case 'TICK':
          setTimeLeft(payload.remainingTime);
          break;
        case 'COMPLETE':
          handleTimerComplete();
          break;
      }
    };

    // Cleanup worker on component unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'STOP' });
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (!isBreak) {
      // Switch to break
      setIsBreak(true);
      setTimeLeft(5 * 60); // 5 minutes break
    } else {
      // Switch back to work
      setIsBreak(false);
      setTimeLeft(25 * 60); // 25 minutes work
    }
    // Play notification sound
    new Audio('/notification.mp3').play().catch(console.error);
  };

  const toggleTimer = () => {
    if (isRunning) {
      workerRef.current?.postMessage({ type: 'PAUSE' });
    } else {
      workerRef.current?.postMessage({ 
        type: 'START', 
        payload: { duration: timeLeft } 
      });
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    const defaultTime = isBreak ? 5 * 60 : 25 * 60;
    workerRef.current?.postMessage({ 
      type: 'RESET', 
      payload: { duration: defaultTime } 
    });
    setTimeLeft(defaultTime);
    setIsRunning(false);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white dark:bg-[#222126] p-4 rounded-xl shadow-xl flex flex-col items-center justify-center ${className}`}>
      <div className="text-4xl font-bold mb-4 text-gray-800 dark:text-zinc-200">
        {formatTime(timeLeft)}
      </div>
      <div className="flex space-x-4">
        <button
          onClick={toggleTimer}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className="px-6 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-zinc-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {isBreak ? 'Break Time' : 'Focus Time'}
      </div>
    </div>
  );
};

export default PomodoroWidget; 