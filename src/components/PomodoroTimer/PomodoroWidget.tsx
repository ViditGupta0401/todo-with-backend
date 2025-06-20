import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateLeft, faGear } from '@fortawesome/free-solid-svg-icons';
import { usePopup } from '../../context/PopupContext';
import './PomodoroWidget.css';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakAfter: number; // sessions
  alarmSound?: string; // oscillator type: 'triangle', 'sine', 'square', 'sawtooth'
  alarmVolume?: number; // volume between 0 and 1
}

const defaultSettings: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakAfter: 4,
  alarmSound: 'triangle',
  alarmVolume: 0.3
};

const PomodoroWidget: React.FC = () => {
  const { openPopup } = usePopup();
  const [settings, setSettings] = useState<TimerSettings>(
    JSON.parse(localStorage.getItem('pomodoroSettings') || JSON.stringify(defaultSettings))
  );
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(settings.focusDuration * 60); // in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  
  const intervalRef = useRef<number | null>(null);
  const totalTime = useRef<number>(settings.focusDuration * 60);
  const lastTickRef = useRef<number | null>(null);

  // Load settings from local storage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);  // Save settings to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    
    // Clear any existing timer when settings change
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
    }
    
    // Update time based on current mode and new settings
    switch (mode) {
      case 'focus':
        totalTime.current = settings.focusDuration * 60;
        setTimeLeft(settings.focusDuration * 60);
        break;
      case 'shortBreak':
        totalTime.current = settings.shortBreakDuration * 60;
        setTimeLeft(settings.shortBreakDuration * 60);
        break;
      case 'longBreak':
        totalTime.current = settings.longBreakDuration * 60;
        setTimeLeft(settings.longBreakDuration * 60);
        break;
    }
  }, [settings, mode]);
  // Set up timer based on current mode
  useEffect(() => {
    // Update the timer when mode changes
    const updateTimerForMode = () => {
      switch (mode) {
        case 'focus':
          totalTime.current = settings.focusDuration * 60;
          setTimeLeft(settings.focusDuration * 60);
          break;
        case 'shortBreak':
          totalTime.current = settings.shortBreakDuration * 60;
          setTimeLeft(settings.shortBreakDuration * 60);
          break;
        case 'longBreak':
          totalTime.current = settings.longBreakDuration * 60;
          setTimeLeft(settings.longBreakDuration * 60);
          break;
      }
    };
    
    // Clear any existing interval when mode changes
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      setIsRunning(false);
    }
    
    updateTimerForMode();
  }, [mode, settings]);
  
  useEffect(() => {
    // Clean up interval on unmount
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);  const pauseTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastTickRef.current = null;
    setIsRunning(false);
  };

  const startTimer = () => {
    if (intervalRef.current !== null) return;
    setIsRunning(true);
    lastTickRef.current = Date.now();
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          handleTimerComplete();
          return 0;
        }
        // Calculate elapsed time since last tick
        const now = Date.now();
        const lastTick = lastTickRef.current || now;
        const elapsed = Math.floor((now - lastTick) / 1000);
        lastTickRef.current = now;
        // If tab was inactive, elapsed could be > 1
        return Math.max(prevTime - elapsed, 0);
      });
    }, 1000);
  };
  
  const resetTimer = () => {
    pauseTimer();
    switch (mode) {
      case 'focus':
        setTimeLeft(settings.focusDuration * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreakDuration * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakDuration * 60);
        break;
    }
  };  const handleTimerComplete = () => {
    pauseTimer();
    playAlertSound();
    
    // Logic for switching modes
    if (mode === 'focus') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      
      // After configured number of focus sessions, take a long break
      if (newSessionsCompleted % settings.longBreakAfter === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      // After any break, go back to focus mode
      setMode('focus');
    }
  };  // Store audio context reference for stopping the alarm
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);

  const playAlertSound = () => {
    // Create audio programmatically using Web Audio API
    try {
      // Clear any existing alarm
      stopAlarmSound();
      
      // Request notification permission
      if (Notification && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
      
      // Create a continuous alarm sound that will run for 15 seconds
      // @ts-expect-error - TypeScript doesn't recognize webkitAudioContext
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      // Create oscillator for alarm sound
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
        // Set up parameters based on user settings
      const volume = settings.alarmVolume ?? 0.3; // Default to 0.3 if not set
      const soundType = settings.alarmSound ?? 'triangle'; // Default to 'triangle' if not set
      
      gainNode.gain.value = volume;
      oscillator.frequency.value = 800;
      oscillator.type = soundType as OscillatorType;
      
      // Store reference to oscillator for stopping it later
      oscillatorRef.current = oscillator;
      
      // Start alarm sound
      oscillator.start();
      
      // Create notification after a short delay to ensure sound starts playing
      setTimeout(() => {
        showNotification();
      }, 500);
      
      // Set timeout to stop the alarm after 15 seconds
      alarmTimeoutRef.current = window.setTimeout(() => {
        stopAlarmSound();
      }, 15000);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };
  
  const stopAlarmSound = () => {
    // Stop any existing oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Clear any existing timeout
    if (alarmTimeoutRef.current) {
      window.clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
  };
  
  const showNotification = () => {
    // Check if notifications are supported and permission is granted
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }
    
    if (Notification.permission === "granted") {
      const title = mode === 'focus' ? 'Focus Session Complete!' : 'Break Time Over!';
      const body = mode === 'focus' ? 'Time to take a break!' : 'Time to focus again!';
      
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        requireInteraction: true // Notification persists until user interacts with it
      });
      
      // Stop alarm when notification is clicked
      notification.onclick = () => {
        stopAlarmSound();
        notification.close();
      };
    } else if (Notification.permission !== "denied") {
      // We need to ask the user for permission
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          showNotification();
        }
      });
    }
  };

  const toggleStartPause = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get color based on current mode
  const getModeColor = (): string => {
    switch (mode) {
      case 'focus':
        return '#ff4101';
      case 'shortBreak':
        return '#00a8cc';
      case 'longBreak':
        return '#46cb3a';
      default:
        return '#ff4101';
    }
  };
  // Handle settings changes
  const updateSetting = (key: keyof TimerSettings, value: number | string) => {
    setSettings({ ...settings, [key]: value });
  };
  
  return (
    <>
      <div className={"pomodoro-widget shadow-xl  rounded-3xl p-6 text-white flex flex-col items-center relative overflow-hidden bg-zinc-800 transition-colors duration-700"} >
        {/* Mode selection tabs */}
        <div className="mode-tabs w-full flex justify-center mb-6">
          <div className="bg-[#18181C] p-1 rounded-full flex w-full max-w-[150px] ">
            <button 
              onClick={() => setMode('focus')}
              className={`flex-1 py-1 px-1 rounded-full flex items-center justify-center transition-all ${
                mode === 'focus' 
                  ? 'bg-[#ff4101]/10 shadow-md' 
                  : 'hover:bg-white/5'
              }`}
              title="Focus"
            >
              <span dangerouslySetInnerHTML={{ __html: `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none'><path opacity='.4' d='M16.19 2H7.82C4.18 2 2.01 4.17 2.01 7.81v8.37c0 3.64 2.17 5.81 5.81 5.81h8.37c3.64 0 5.81-2.17 5.81-5.81V7.81C22 4.17 19.83 2 16.19 2Z' fill='${mode === 'focus' ? '#c2410c' : '#FF8A65'}'></path><path d='M11.5 8.089v9.16c0 .36-.36.6-.69.46-1.21-.52-2.79-1-3.89-1.14l-.19-.02c-.61-.08-1.11-.65-1.11-1.27v-7.7c0-.76.62-1.33 1.38-1.27 1.25.1 3.1.7 4.26 1.36.15.07.24.24.24.42ZM18.38 7.7v7.57c0 .62-.5 1.19-1.11 1.27l-.21.02c-1.09.15-2.66.62-3.87 1.13-.33.14-.69-.1-.69-.46V8.08a.5.5 0 0 1 .25-.44c1.16-.65 2.97-1.23 4.2-1.34h.04c.77.01 1.39.63 1.39 1.4Z' fill='${mode === 'focus' ? '#c2410c' : '#FF8A65'}'></path></svg>` }} />
            </button>
            <button 
              onClick={() => setMode('shortBreak')}
              className={`flex-1 py-1 px-1 rounded-full flex items-center justify-center transition-all ${
                mode === 'shortBreak' 
                  ? 'bg-[#00a8cc]/20 shadow-md' 
                  : 'hover:bg-white/5'
              }`}
              title="Short Break"
            >
              <span dangerouslySetInnerHTML={{ __html: `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none'><path opacity='.6' d='M17.79 10.472v1.53H2v-1.53c0-2.32 1.89-4.21 4.21-4.21h7.37c2.32 0 4.21 1.89 4.21 4.21Z' fill='${mode === 'shortBreak' ? '#0e7490' : '#FF8A65'}'></path><path opacity='.4' d='M17.79 12v5.79c0 2.32-1.89 4.21-4.21 4.21H6.21C3.89 22 2 20.11 2 17.79V12h15.79Z' fill='${mode === 'shortBreak' ? '#0e7490' : '#FF8A65'}'></path><path d='M5.5 5.121c-.41 0-.75-.34-.75-.75v-1.75c0-.41.34-.75.75-.75s.75.34.75.75v1.75c0 .42-.34.75-.75.75ZM9.5 5.121c-.41 0-.75-.34-.75-.75v-1.75c0-.41.34-.75.75-.75s.75.34.75.75v1.75c0 .42-.34.75-.75.75ZM13.5 5.121c-.41 0-.75-.34-.75-.75v-1.75c0-.41.34-.75.75-.75s.75.34.75.75v1.75c0 .42-.34.75-.75.75ZM21.65 14.322c0 2.15-1.74 3.89-3.89 3.89v-7.79c2.14 0 3.89 1.75 3.89 3.9Z' fill='${mode === 'shortBreak' ? '#0e7490' : '#FF8A65'}'></path></svg>` }} />
            </button>
            <button 
              onClick={() => setMode('longBreak')}
              className={`flex-1 py-1 px-1 rounded-full flex items-center justify-center transition-all ${
                mode === 'longBreak' 
                  ? 'bg-[#46cb3a]/20 shadow-md' 
                  : 'hover:bg-white/5'
              }`}
              title="Long Break"
            >
              <span dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"><path opacity=".4" d="M16.17 10.06H7.83c-1.18 0-1.59-.79-.9-1.75l4.17-5.84c.49-.7 1.31-.7 1.8 0l4.17 5.84c.69.96.28 1.75-.9 1.75Z" fill='${mode === 'longBreak' ? '#46cb3a' : '#FF8A65'}'></path><path d="M17.59 17.999H6.41c-1.58 0-2.12-1.05-1.19-2.33l3.99-5.61h5.58l3.99 5.61c.93 1.28.39 2.33-1.19 2.33ZM12.75 18v4c0 .41-.34.75-.75.75s-.75-.34-.75-.75v-4h1.5Z" fill='${mode === 'longBreak' ? '#46cb3a' : '#FF8A65'}'></path></svg>` }} />
            </button>
          </div>
        </div>
        
        <div className="timer-container relative flex flex-col items-center justify-center mb-4">
          {/* Circular progress ring with time inside */}
          <div className="timer-circle relative flex items-center justify-center" style={{ width: 190, height: 190 }}>
            <svg width="190" height="190" viewBox="0 0 100 100" className="absolute top-0 left-0">
              {/* Background ring (full gray) */}
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="#18181C"
                strokeWidth="7"
              />
              {/* Progress arc (colored, shows remaining time) */}
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={getModeColor()}
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={(2 * Math.PI * 45) * (timeLeft / totalTime.current)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,1.6,.6,1)' }}
                transform="rotate(-90 50 50)"
              />
            </svg>
            {/* Time display and eye icon inside the ring */}
            <div className="time-display absolute w-full h-full flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tracking-wide drop-shadow-md" style={{ letterSpacing: 2 }}>{formatTime(timeLeft)}</span>
              {/* Mode icon instead of label */}
          <div className="mode-icon text-xs tracking-wider mt-3 font-medium flex items-center justify-center" style={{ letterSpacing: 2 }}>
            {mode === 'focus' && (
              <h1 className='text-[#ff4101]' >Focus</h1>
            )}
            {mode === 'shortBreak' && (
             <h1 className='text-[#00a8cc]'>Short Break</h1>
            )}
            {mode === 'longBreak' && (
                <h1 className='text-[#46cb3a]'>Long Break</h1>
            )}
          </div>
              
            </div>
          </div>
          
          {/* Session indicators */}
          <div className="session-indicators flex space-x-1.5 mt-2">
            {[...Array(settings.longBreakAfter)].map((_, i) => (
              <div
                key={i}
                className={`session-indicator w-2 h-2 rounded-full transition-colors duration-300 ${
                  i < sessionsCompleted % settings.longBreakAfter ? '' : 'bg-gray-700'
                }`}
                style={{
                  backgroundColor: i < sessionsCompleted % settings.longBreakAfter ? getModeColor() : undefined
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Controls */}
        <div className="controls flex items-center">        {/* Reset button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="reset-button h-10 w-10 rounded-full flex items-center justify-center bg-[#1a1a1a] hover:bg-[#333] transition-colors mr-4 "
            onClick={resetTimer}
            title="Reset Timer"
          >
            <FontAwesomeIcon icon={faArrowRotateLeft} className="opacity-80" />
          </motion.button>
          
          {/* Start/Pause button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            style={{ backgroundColor: `${getModeColor()}33`, color: getModeColor() }}
            className="start-pause-button h-12 w-32 rounded-full font-medium transition-all duration-300 shadow-md"
            onClick={toggleStartPause}
          >
            {isRunning ? 'PAUSE' : 'START'}
          </motion.button>
            {/* Settings button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="settings-button h-10 w-10 rounded-full flex items-center justify-center bg-[#1a1a1a] hover:bg-[#333] transition-colors ml-4 "
            onClick={() => openPopup('pomodoroSettings', { 
              settings, 
              onUpdateSetting: updateSetting 
            })}
            title="Timer Settings"
          >
            <FontAwesomeIcon icon={faGear} className="opacity-80" />
          </motion.button>
        </div>
      </div>
    </>
  );
};

export default PomodoroWidget;
