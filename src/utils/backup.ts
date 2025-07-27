import { Task } from '../types';

export const exportData = (): string => {
  const data = {
    tasks: localStorage.getItem('todo-tracker-tasks'),
    dailyData: localStorage.getItem('todo-tracker-daily-data'),
    lastSavedDate: localStorage.getItem('last-saved-date'),
    widgets: localStorage.getItem('widget-layouts'),
    theme: localStorage.getItem('theme'),
    quickLinks: localStorage.getItem('quick-links'),
    pomodoroSettings: localStorage.getItem('pomodoro-settings')
  };
  
  return JSON.stringify(data);
};

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    // Validate data structure
    const requiredKeys = ['tasks', 'dailyData', 'lastSavedDate'];
    if (!requiredKeys.every(key => key in data)) {
      return false;
    }

    // Store data
    if (data.tasks) localStorage.setItem('todo-tracker-tasks', data.tasks);
    if (data.dailyData) localStorage.setItem('todo-tracker-daily-data', data.dailyData);
    if (data.lastSavedDate) localStorage.setItem('last-saved-date', data.lastSavedDate);
    if (data.widgets) localStorage.setItem('widget-layouts', data.widgets);
    if (data.theme) localStorage.setItem('theme', data.theme);
    if (data.quickLinks) localStorage.setItem('quick-links', data.quickLinks);
    if (data.pomodoroSettings) localStorage.setItem('pomodoro-settings', data.pomodoroSettings);

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Auto-backup functionality
export const setupAutoBackup = (intervalMinutes: number = 30) => {
  const AUTO_BACKUP_KEY = 'todo-auto-backup';
  
  setInterval(() => {
    try {
      const backup = exportData();
      localStorage.setItem(AUTO_BACKUP_KEY, backup);
      localStorage.setItem(`${AUTO_BACKUP_KEY}-time`, new Date().toISOString());
    } catch (error) {
      console.error('Auto-backup failed:', error);
    }
  }, intervalMinutes * 60 * 1000);
  
  // Attempt to recover from auto-backup on load
  try {
    const lastBackup = localStorage.getItem(AUTO_BACKUP_KEY);
    if (lastBackup && !localStorage.getItem('todo-tracker-tasks')) {
      importData(lastBackup);
    }
  } catch (error) {
    console.error('Auto-recovery failed:', error);
  }
};
