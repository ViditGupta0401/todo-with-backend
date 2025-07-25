import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OutputData } from '@editorjs/editorjs';

// Define a reusable Note interface
export interface Note {
  id: string;
  title: string;
  content: OutputData;
  color: string;
  createdAt: number;
  updatedAt: number;
}

// Define popup types
export type PopupType = 'addEvent' | 'addQuickLink' | 'userGuide' | 'dailyInfo' | 'dayDetails' | 'eventDetails' | 'pomodoroSettings' | 'updateInfo' | 'noteEditor' | 'auth';

// Define what data each popup type needs
interface PopupData {
  addEvent?: {
    initialDate?: string;
    initialTime?: string;
  };
  addQuickLink?: {
    initialTitle?: string;
    initialUrl?: string;
  };
  userGuide?: {
    section?: string;
  };
  dailyInfo?: {
    date?: string;
  };  pomodoroSettings?: {
    settings: {
      focusDuration: number;
      shortBreakDuration: number;
      longBreakDuration: number;
      longBreakAfter: number;
      alarmSound?: string;
      alarmVolume?: number;
    };
    onUpdateSetting: (key: string, value: number | string) => void;
  };
  dayDetails?: {
    date: string;
    dayData: {
      date: string;
      completedTasks: number;
      totalTasks: number;
      completedTaskIds: string[];
      repeatingTaskIds: string[];
      nonRepeatingTaskIds: string[];
      completedTaskTexts?: { id: string; text: string; priority: 'high' | 'medium' | 'low' }[];
      remark?: string;
    };
    tasks: Array<{
      id: string;
      text: string;
      priority: 'high' | 'medium' | 'low';
      completed: boolean;
      timestamp: number;
      isRepeating: boolean;
    }>;
  };
  eventDetails?: {
    date: string;
    events: Array<{
      id: string;
      title: string;
      date: string;
      time: string;
      description?: string;
      color: string;
    }>;
  };
  updateInfo?: {
    version: string;
    changelog: string[];
  };
  noteEditor?: {
    note: Note | null;
    onSave: (note: Note) => void;
  };
}

interface PopupContextProps {
  activePopup: PopupType | null;
  popupData: PopupData;
  openPopup: (type: PopupType, data?: any) => void;
  closePopup: () => void;
}

const PopupContext = createContext<PopupContextProps>({
  activePopup: null,
  popupData: {},
  openPopup: () => {},
  closePopup: () => {},
});

export const usePopup = () => useContext(PopupContext);

interface PopupProviderProps {
  children: ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [activePopup, setActivePopup] = useState<PopupType | null>(null);
  const [popupData, setPopupData] = useState<PopupData>({});

  const openPopup = (type: PopupType, data: any = {}) => {
    setActivePopup(type);
    setPopupData({ [type]: data });
  };

  const closePopup = () => {
    setActivePopup(null);
    setPopupData({});
  };

  return (
    <PopupContext.Provider
      value={{
        activePopup,
        popupData,
        openPopup,
        closePopup,
      }}
    >
      {children}
    </PopupContext.Provider>
  );
};
