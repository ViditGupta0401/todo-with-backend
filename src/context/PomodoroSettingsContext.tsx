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

import { downloadPomodoroSettingsFromSupabase } from '../utils/supabaseSync';

export const PomodoroSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: currentUser, isGuest: isGuestUser } = useUser();
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    // First try to get from localStorage
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

  // Load settings from Supabase when user logs in
  React.useEffect(() => {
    const loadSettings = async () => {
      if (user && !isGuest) {
        try {
          const supabaseSettings = await downloadPomodoroSettingsFromSupabase(user.id);
          if (supabaseSettings && Object.keys(supabaseSettings).length > 0) {
            // Merge with defaults to ensure all required fields exist
            const mergedSettings = {
              ...defaultSettings,
              ...supabaseSettings
            };
            setSettings(mergedSettings);
            localStorage.setItem('pomodoroSettings', JSON.stringify(mergedSettings));
          } else if (settings) {
            // If no settings in Supabase but we have local settings, upload them
            await uploadPomodoroSettingsToSupabase(user.id, settings);
          }
        } catch (error) {
          console.error('Error loading Pomodoro settings:', error);
        }
      }
    };
    loadSettings();
  }, [currentUser, isGuestUser]);

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