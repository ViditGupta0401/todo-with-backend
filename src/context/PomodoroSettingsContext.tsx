import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useUser } from './UserContext';
import { uploadPomodoroSettingsToSupabase } from '../utils/supabaseSync';

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakAfter: number;
  alarmSound?: string;
  alarmVolume?: number;
  alarmAudio?: string;
}

const defaultSettings: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakAfter: 4,
  alarmSound: 'triangle',
  alarmVolume: 0.3,
  alarmAudio: 'alarm_wake_up',
};

interface PomodoroSettingsContextType {
  settings: PomodoroSettings;
  updateSetting: (key: keyof PomodoroSettings, value: number | string) => void;
}

const PomodoroSettingsContext = createContext<PomodoroSettingsContextType | undefined>(undefined);

export const usePomodoroSettings = () => {
  const ctx = useContext(PomodoroSettingsContext);
  if (!ctx) throw new Error('usePomodoroSettings must be used within PomodoroSettingsProvider');
  return ctx;
};

export const PomodoroSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    const saved = localStorage.getItem('pomodoroSettings');
    if (!saved) {
      const legacy = localStorage.getItem('pomodoro');
      if (legacy) {
        localStorage.setItem('pomodoroSettings', legacy);
        localStorage.removeItem('pomodoro');
        return JSON.parse(legacy);
      }
    }
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const { user, isGuest } = useUser();

  const updateSetting = (key: keyof PomodoroSettings, value: number | string) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('pomodoroSettings', JSON.stringify(updated));
      if (user && !isGuest) uploadPomodoroSettingsToSupabase(user.id, updated);
      return updated;
    });
  };

  return (
    <PomodoroSettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </PomodoroSettingsContext.Provider>
  );
};

export { PomodoroSettingsContext }; 