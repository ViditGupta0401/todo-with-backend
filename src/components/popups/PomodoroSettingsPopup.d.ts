// This file provides TypeScript declarations for the PomodoroSettingsPopup.jsx component
// to ensure type safety when used from TypeScript files

import React from 'react';

interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakAfter: number;
  alarmSound?: string;
  alarmVolume?: number;
}

interface PomodoroSettingsPopupProps {
  settings: PomodoroSettings;
  onUpdateSetting: (key: keyof PomodoroSettings, value: number | string) => void;
}

declare const PomodoroSettingsPopup: React.FC<PomodoroSettingsPopupProps>;

export default PomodoroSettingsPopup;
