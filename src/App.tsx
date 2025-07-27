import { useState, useMemo, useEffect, useRef } from 'react';
import { TaskList } from './components/TaskList';
import { Analytics } from './components/Analytics';
import { Heatmap } from './components/Heatmap';
import { QuickLinks } from './components/QuickLinks';
import { BMICalculator } from './components/BMICalculator';
import { useTheme } from './context/ThemeContext';
import Dock from './components/Dock';
import WidgetManager, { Widget } from './components/WidgetManager';
import WidgetSelector, { WidgetTemplate } from './components/WidgetSelector';
import { useWidgetContext } from './context/WidgetContext';
import PomodoroWidget from './components/PomodoroTimer/PomodoroWidget';
import { PomodoroSettingsProvider } from './context/PomodoroSettingsContext';

import PopupManager from './components/popups/PopupManager';
import type { Task, Filter } from './types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getLocalDate } from './utils/dateUtils';
import { setupAutoBackup } from './utils/backup';
import { faDumbbell } from '@fortawesome/free-solid-svg-icons';
import ClockWidget from './components/ClockWidget';
import UpcomingEventsWidget from './components/UpcomingEventsWidget';
import { migrateWidgetLayouts, migrateTasks, ensureValidWidgetLayouts } from './utils/migration';
import LeetCodeWidget from './components/LeetCodeWidget';
import welcomePenguin from './penguin images/welcome.png';
import { RoughNotation, RoughNotationGroup } from 'react-rough-notation';
import { pageview, event } from './utils/analytics';
import { usePopup } from './context/PopupContext';
import { supabase } from './utils/supabaseClient';
import {
  migrateLocalDataToSupabase,
  downloadTasksFromSupabase,
  uploadTasksToSupabase,
  setLocalTasks,
  getLocalTasks,
  uploadEventsToSupabase,
  setLocalEvents,
  setLocalActiveWidgets,
  uploadWidgetsToSupabase,
  setLocalTheme,
  uploadThemeToSupabase,
  setLocalQuickLinks,
  uploadQuickLinksToSupabase,
  setLocalPomodoroSettings,
  uploadPomodoroSettingsToSupabase,
  deleteUserAccount
} from './utils/supabaseSync';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useUser } from './context/UserContext';

const STORAGE_KEY = 'todo-tracker-tasks';
const DAILY_DATA_KEY = 'todo-tracker-daily-data';
const LAST_SAVED_DATE_KEY = 'last-saved-date';
const UPDATE_VERSION = '1.8.7'; // Change this on every update
const UPDATE_CHANGELOG = [
  '� Added toggle switches in LeetCodeWidget to show/hide specific action buttons.',
  '🧩 Improved settings menu with better UI for toggling button visibility.',
  '🛠️ Various UI improvements and bug fixes.',
];

interface DailyData {
  date: string;
  completedTasks: number;
  totalTasks: number;
  completedTaskIds: string[];
  repeatingTaskIds: string[];
  nonRepeatingTaskIds: string[];
  completedTaskTexts?: { id: string; text: string; priority: 'high' | 'medium' | 'low' }[];
  remark?: string;
}

function App() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [forceShowAuthPopup, setForceShowAuthPopup] = useState(false); // NEW
  const { user, isGuest, logout } = useUser();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasMoreTasks, setHasMoreTasks] = useState(true);
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);
  const taskPageRef = useRef(0);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isInitialRender = useRef(true);
  
  const currentDateRef = useRef<string>(format(new Date(), 'yyyy-MM-dd'));
  
  const [dailyData, setDailyData] = useState<DailyData[]>(() => {
    const savedData = localStorage.getItem(DAILY_DATA_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error('Error loading daily data from localStorage:', error);
        return [];
      }
    }
    return [];
  });
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { theme } = useTheme();
  const [showBMI, setShowBMI] = useState<boolean>(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  
  const {
    activeWidgets,
    setActiveWidgets,
    setShowWidgetSelector
  } = useWidgetContext();
  
  const [quickLinksKey, setQuickLinksKey] = useState(0);
  const { openPopup, activePopup, closePopup } = usePopup();

  const updateDailyData = (currentTasks: Task[], isInitializing = false) => {
    const now = new Date();
    const today = new Date(now);
    if (now.getHours() < 5) {
      today.setDate(today.getDate() - 1);
    }
    const todayStr = format(today, 'yyyy-MM-dd');
    
    if (currentDateRef.current !== todayStr) {
      console.log(`Date has changed: ${currentDateRef.current} -> ${todayStr}`);
      currentDateRef.current = todayStr;
    }
    
    console.log(`${isInitializing ? 'Initializing' : 'Updating'} daily data for:`, todayStr);
    
    const repeatingCount = currentTasks.filter(task => task.isRepeating).length;
    const nonRepeatingCount = currentTasks.filter(task => !task.isRepeating).length;
    const completedCount = currentTasks.filter(task => task.completed).length;
    
    console.log(`Task composition: ${repeatingCount} repeating, ${nonRepeatingCount} non-repeating, ${completedCount} completed`);
    
    const repeatingTaskIds = currentTasks
      .filter(task => task.isRepeating)
      .map(task => task.id);
    
    const nonRepeatingTaskIds = currentTasks
      .filter(task => !task.isRepeating)
      .map(task => task.id);
    
    const completedTaskIds = currentTasks
      .filter(task => task.completed)
      .map(task => task.id);
    
    const totalTasksForToday = isInitializing ? 
      repeatingTaskIds.length : 
      repeatingTaskIds.length + nonRepeatingTaskIds.length;
    
    const completedTaskTexts = currentTasks
      .filter(task => task.completed)
      .map(task => ({
        id: task.id,
        text: task.text,
        priority: task.priority
      }));
    
    setDailyData(prevData => {
      const existingDayIndex = prevData.findIndex(d => d.date === todayStr);
      if (existingDayIndex >= 0) {
        const newData = [...prevData];
        const existingCompletedTexts = newData[existingDayIndex].completedTaskTexts || [];
        
        newData[existingDayIndex] = {
          ...newData[existingDayIndex],
          completedTasks: completedTaskIds.length,
          totalTasks: totalTasksForToday,
          completedTaskIds: completedTaskIds,
          repeatingTaskIds: repeatingTaskIds,
          nonRepeatingTaskIds: nonRepeatingTaskIds,
          completedTaskTexts: isInitializing
            ? completedTaskTexts
            : [...existingCompletedTexts, ...completedTaskTexts.filter(newTask => 
                !existingCompletedTexts.some(existingTask => existingTask.id === newTask.id)
              )]
        };
        return newData;
      } else {
        const newDayData = {
          date: todayStr,
          completedTasks: completedTaskIds.length,
          totalTasks: totalTasksForToday,
          completedTaskIds: completedTaskIds,
          repeatingTaskIds: repeatingTaskIds,
          nonRepeatingTaskIds: nonRepeatingTaskIds,
          completedTaskTexts: completedTaskTexts
        };
        return [...prevData, newDayData];
      }
    });
  };
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      console.log('Loading tasks from localStorage:', savedTasks);
      
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks).map((task: {
          id: string;
          text: string;
          priority?: 'high' | 'medium' | 'low';
          completed: boolean;
          timestamp: number | string;
          isRepeating?: boolean;
          lastCompleted?: number | string;
        }) => ({
          ...task,
          timestamp: typeof task.timestamp === 'string' ? Number(task.timestamp) : task.timestamp,
          lastCompleted: task.lastCompleted ? 
            (typeof task.lastCompleted === 'string' ? Number(task.lastCompleted) : task.lastCompleted) : 
            undefined,
          isRepeating: !!task.isRepeating,
          priority: task.priority || 'medium',
        }));
        
        console.log('Parsed tasks:', parsedTasks);
        if (parsedTasks.length > 0) {
          const now = new Date();
          const today = new Date(now);
          if (now.getHours() < 5) {
            today.setDate(today.getDate() - 1);
          }
          const todayStr = format(today, 'yyyy-MM-dd');
          
          const lastSavedDate = localStorage.getItem(LAST_SAVED_DATE_KEY);
          
          currentDateRef.current = todayStr;
          
          const needsReset = !lastSavedDate || lastSavedDate !== todayStr;
          
          console.log('Last saved date:', lastSavedDate, 'Current date:', todayStr, 'Needs reset:', needsReset);
          
          if (needsReset) {
            const repeatingTasksOnly = parsedTasks
              .filter((task: Task) => task.isRepeating)
              .map((task: Task) => ({
                ...task,
                completed: false
              }));
            
            const nonRepeatingCount = parsedTasks.filter((task: Task) => !task.isRepeating).length;
            console.log(`Day changed - Filtered out ${nonRepeatingCount} non-repeating tasks, kept ${repeatingTasksOnly.length} repeating tasks (reset to unchecked)`);
            
            setTasks(repeatingTasksOnly);
            
            localStorage.setItem(LAST_SAVED_DATE_KEY, todayStr);
          } else {
            console.log(`Same day - loading all ${parsedTasks.length} tasks without changes`);
            setTasks(parsedTasks);
          }
        }
      }
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
    }
  }, []);
  useEffect(() => {
    try {
      if (tasks.length > 0 || localStorage.getItem(STORAGE_KEY) === null) {
        console.log('Saving tasks to localStorage:', tasks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      }
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks]);
  
  useEffect(() => {
    if (tasks.length === 0) return;
    
    const now = new Date();
    const today = new Date(now);
    if (now.getHours() < 5) {
      today.setDate(today.getDate() - 1);
    }
    const todayStr = format(today, 'yyyy-MM-dd');
    
    currentDateRef.current = todayStr;
    
    const hasTodayEntry = dailyData.some(d => d.date === todayStr);
    
    if (!hasTodayEntry) {
      console.log('Auto-initializing daily data for today:', todayStr);
      
      const repeatingTaskIds = tasks
        .filter(task => task.isRepeating)
        .map(task => task.id);
      
      const nonRepeatingTaskIds: string[] = [];
      
      setDailyData(prevData => {
        const newDayData = {
          date: todayStr,
          completedTasks: 0,
          totalTasks: repeatingTaskIds.length,
          completedTaskIds: [],
          repeatingTaskIds: repeatingTaskIds,
          nonRepeatingTaskIds: nonRepeatingTaskIds,
          completedTaskTexts: []
        };
        return [...prevData, newDayData];
      });
    }
  }, [tasks, dailyData]);

  useEffect(() => {
    try {
      localStorage.setItem(DAILY_DATA_KEY, JSON.stringify(dailyData));
    } catch (error) {
      console.error('Error saving daily data to localStorage:', error);
    }
  }, [dailyData]);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    const checkDayChange = () => {
      const now = new Date();
      
      if (now.getHours() === 5 && now.getMinutes() === 0) {
        console.log('5 AM detected, resetting tasks for the new day');
        
        const currentDate = format(now, 'yyyy-MM-dd');
        const previousDate = format(new Date(new Date().setDate(now.getDate() - 1)), 'yyyy-MM-dd');
        
        localStorage.setItem(LAST_SAVED_DATE_KEY, currentDate);
        
        const yesterdayData = dailyData.find(d => d.date === previousDate);
        
        if (yesterdayData) {
          const allYesterdayTasks = tasks.filter(task => 
            (task.isRepeating && yesterdayData.repeatingTaskIds.includes(task.id)) || 
            (!task.isRepeating && yesterdayData.nonRepeatingTaskIds.includes(task.id))
          );
          
          const allCompletedTasks = allYesterdayTasks
            .filter(task => task.completed)
            .map(task => ({
              id: task.id,
              text: task.text,
              priority: task.priority
            }));
          
          if (allCompletedTasks.length > 0) {
            setDailyData(prevData => {
              const updatedData = [...prevData];
              const yesterdayIndex = updatedData.findIndex(d => d.date === previousDate);
              
              if (yesterdayIndex >= 0) {
                const existingIds = new Set((updatedData[yesterdayIndex].completedTaskTexts || [])
                  .map(task => task.id));
                
                const newCompletedTasks = allCompletedTasks.filter(task => !existingIds.has(task.id));
                
                updatedData[yesterdayIndex] = {
                  ...updatedData[yesterdayIndex],
                  completedTaskTexts: [
                    ...(updatedData[yesterdayIndex].completedTaskTexts || []),
                    ...newCompletedTasks
                  ]
                };
              }
              
              return updatedData;
            });
            
            console.log('Saved', allCompletedTasks.length, 'completed tasks to history');
          }
        }
        
        console.log('Tasks before 5 AM reset:', tasks);
        
        const repeatingTasksList = tasks
          .filter(task => task.isRepeating)
          .map(task => ({
            ...task,
            completed: false,
            lastCompleted: task.completed ? Date.now() : task.lastCompleted
          }));
        
        console.log('Tasks after 5 AM reset (repeating tasks only, unchecked):', repeatingTasksList);
          
        const resetDate = format(new Date(), 'yyyy-MM-dd');
        console.log('Resetting tasks for date:', resetDate);
        
        const nonRepeatingCount = tasks.filter(task => !task.isRepeating).length;
        const repeatingCount = repeatingTasksList.length;
        
        console.log(`Task reset summary: Kept ${repeatingCount} repeating tasks (now incomplete), removed ${nonRepeatingCount} non-repeating tasks`);
        
        setTasks(repeatingTasksList);
        
        setDailyData(prevData => {
          const repeatingTaskIds = repeatingTasksList.map(task => task.id);
          
          const existingDayIndex = prevData.findIndex(d => d.date === currentDate);
          
          if (existingDayIndex >= 0) {
            const newData = [...prevData];
            newData[existingDayIndex] = {
              ...newData[existingDayIndex],
              completedTasks: 0,
              completedTaskIds: [],
              repeatingTaskIds: repeatingTaskIds, 
              nonRepeatingTaskIds: [],
              totalTasks: repeatingTaskIds.length,
              completedTaskTexts: []
            };
            return newData;
          } else {
            return [...prevData, {
              date: currentDate,
              completedTasks: 0,
              totalTasks: repeatingTaskIds.length,
              completedTaskIds: [],
              repeatingTaskIds: repeatingTaskIds,
              nonRepeatingTaskIds: [],
              completedTaskTexts: []
            }];
          }
        });
      }
    };

    const interval = setInterval(checkDayChange, 60000);

    return () => clearInterval(interval);
  }, [tasks, dailyData]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    });  }, [tasks, filter]);

  const heatmapData = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const data: { [key: string]: number } = {};
    
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayData = dailyData.find(d => d.date === dateKey);
      data[dateKey] = dayData?.completedTasks || 0;
    });
    
    return data;
  }, [dailyData, selectedMonth]);

  const analyticsData = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    if (now.getHours() < 5) {
      today.setDate(today.getDate() - 1);
    }
    const todayStr = format(today, 'yyyy-MM-dd');

    const activeDays = dailyData.filter(day => day.completedTasks > 0);
    
    const sortedDays = [...activeDays].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let checkDate = new Date(todayStr);
    
    const todayActivity = sortedDays.find(day => day.date === todayStr);
    if (todayActivity) {
      currentStreak = 1;
      
      for (let i = 1; i <= 366; i++) {
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = format(prevDate, 'yyyy-MM-dd');
        
        const hasPrevDay = sortedDays.some(day => day.date === prevDateStr);
        
        if (hasPrevDay) {
          currentStreak++;
          checkDate = prevDate;
        } else {
          break;
        }
      }
    }
    
    let longestStreak = currentStreak;
    let tempStreak = 0;
    
    const chronologicalDays = [...activeDays].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (let i = 0; i < chronologicalDays.length; i++) {
      const currentDate = new Date(chronologicalDays[i].date);
      
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(chronologicalDays[i-1].date);
        const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    const totalCompletedTasks = dailyData.reduce((sum, day) => 
      sum + day.completedTasks, 0);
    
    const totalTasks = dailyData.reduce((sum, day) => 
      sum + day.totalTasks, 0);
    
    const completionRate = totalTasks > 0 
      ? Math.round((totalCompletedTasks / totalTasks) * 100) 
      : 0;

    return {
      currentStreak,
      longestStreak,
      totalActiveDays: activeDays.length,
      completionRate,
    };
  }, [dailyData]);

  const addTask = async (text: string, priority: Task['priority'], isRepeating: boolean = false) => {
    event({
      action: 'add_task',
      category: 'Tasks',
      label: isRepeating ? 'repeating' : 'one-time',
      value: 1
    });
    const timestamp = Date.now();
    const taskDate = format(new Date(timestamp), 'yyyy-MM-dd');
    console.log('Adding task with timestamp:', timestamp, 'date:', taskDate, 'isRepeating:', isRepeating);
    
    const newTask: Task = {
      id: timestamp.toString(),
      text,
      priority,
      completed: false,
      timestamp: timestamp,
      isRepeating: isRepeating,
      lastCompleted: undefined
    };
    
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);

    // Sync with backend if authenticated
    if (user && !isGuest) {
      try {
        await uploadTasksToSupabase(user.id, updatedTasks);
      } catch (error) {
        console.error('Failed to sync task:', error);
        // On error, make sure local storage is updated
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
      }
    } else {
      // For guest users, just use local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    }
    
    updateDailyData(updatedTasks, false);
  };

  const toggleTask = async (id: string) => {
    event({
      action: 'toggle_task',
      category: 'Tasks',
      label: 'task_completion'
    });

    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const now = Date.now();
        return {
          ...task,
          completed: !task.completed,
          lastCompleted: !task.completed ? now : task.lastCompleted
        };
      }
      return task;
    });

    setTasks(updatedTasks);

    // Sync with backend if authenticated
    if (user && !isGuest) {
      try {
        await uploadTasksToSupabase(user.id, updatedTasks);
      } catch (error) {
        console.error('Failed to sync task toggle:', error);
        // On error, make sure local storage is updated
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
      }
    } else {
      // For guest users, just use local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    }

    updateDailyData(updatedTasks, false);
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    if (user && !isGuest) {
      uploadTasksToSupabase(user.id, updatedTasks);
      supabase.from('tasks').delete().eq('user_id', user.id).then(() => {
        if (updatedTasks.length > 0) {
          supabase.from('tasks').insert(updatedTasks.map(t => ({ ...t, user_id: user.id })));
        }
      });
    }
    if (!user || isGuest) localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    updateDailyData(updatedTasks, false);
  };

  const updateTask = (id: string, text: string) => {
    if (!text.trim()) return;
    
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, text: text.trim() } : task
    );
    setTasks(updatedTasks);
    if (user && !isGuest) {
      uploadTasksToSupabase(user.id, updatedTasks);
      supabase.from('tasks').delete().eq('user_id', user.id).then(() => {
        if (updatedTasks.length > 0) {
          supabase.from('tasks').insert(updatedTasks.map(t => ({ ...t, user_id: user.id })));
        }
      });
    }
    if (!user || isGuest) localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
  };
  const reorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    if (user && !isGuest) {
      uploadTasksToSupabase(user.id, newTasks);
      supabase.from('tasks').delete().eq('user_id', user.id).then(() => {
        if (newTasks.length > 0) {
          supabase.from('tasks').insert(newTasks.map(t => ({ ...t, user_id: user.id })));
        }
      });
    }
    if (!user || isGuest) localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
  };
  
  const widgetDefinitions = {
    quickLinks: {
      i: 'quickLinks',
      x: 0,
      y: 0,
      w: 1,
      content: <QuickLinks key={quickLinksKey} />
    },
    todoList: {
      i: 'todoList',
      x: 1,
      y: 0,
      w: 2,
      content: (
        <div className="w-full flex flex-col">
          <TaskList
            tasks={filteredTasks}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onUpdateTask={updateTask}
            onReorderTasks={reorderTasks}
            itemTextClassName="text-[1rem] sm:text-[1.125rem]"
            secondaryTextClassName="text-[0.875rem] sm:text-[1rem]"
            captionClassName="text-[0.75rem] sm:text-[0.875rem]"
            filter={filter}
            setFilter={(f: string) => setFilter(f as Filter)}
            showFilterDropdown={showFilterDropdown}
            setShowFilterDropdown={setShowFilterDropdown}
            theme={theme}
            isEmpty={filteredTasks.length === 0}
            onAddClick={addTask}
          />
        </div>
      )
    },
    analytics: {
      i: 'analytics',
      x: 3,
      y: 0,
      w: 1,
      content: (
        <div className="bg-white dark:bg-[#222126] p-3 sm:p-4 md:p-6 shadow-xl rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-normal text-gray-800 dark:text-zinc-200">
              {showBMI ? 'BMI Calculator' : 'Analytics'}
            </h2>
            <button 
              onClick={() => setShowBMI(!showBMI)} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={showBMI ? "Switch to Analytics" : "Switch to BMI Calculator"}
            >
              {showBMI ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff4101]">
                  <path d="M12 20V10"></path>
                  <path d="M18 20V4"></path>
                  <path d="M6 20v-6"></path>
                </svg>                  ) : (
                    <FontAwesomeIcon icon={faDumbbell} className="text-[#ff4101] h-5 w-5" />
                  )}
            </button>
          </div>
          {showBMI ? (
            <BMICalculator 
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          ) : (
            <>
              <div className="mb-4">
                <Analytics data={analyticsData} />
              </div>
              <Heatmap 
                data={heatmapData} 
                dailyData={dailyData}
                tasks={tasks}
                selectedDate={selectedMonth}
                onDateChange={setSelectedMonth}
              />
            </>
          )}
        </div>
      )
    },
    upcomingEvents: {
      i: 'upcomingEvents',
      x: 3,
      y: 1,
      w: 1,
      content: <UpcomingEventsWidget />
    },
    clock: {
      i: 'clock',
      x: 0,
      y: 1,
      w: 1,
      content: <ClockWidget />
    },
    pomodoro: {
      i: 'pomodoro',
      x: 2,
      y: 1,
      w: 1,
      content: <PomodoroWidget />
    },
    leetcode: {
      i: 'leetcode',
      x: 0,
      y: 2,
      w: 2,
      content: <LeetCodeWidget />
    }
  };

  const widgets: Widget[] = activeWidgets
    .filter(id => widgetDefinitions[id as keyof typeof widgetDefinitions])
    .map(id => widgetDefinitions[id as keyof typeof widgetDefinitions]);
  
  const handleAddWidget = (widgetTemplate: WidgetTemplate) => {
    if (!activeWidgets.includes(widgetTemplate.id)) {
      setActiveWidgets([...activeWidgets, widgetTemplate.id]);
      event({
        action: 'add_widget',
        category: 'Widget',
        label: widgetTemplate.title
      });
      const widgetList = Object.values(widgetDefinitions);
      let minX = 0;
      if (widgetList.length > 0) {
        minX = Math.min(...widgetList.map(w => w.x));
      }
      const defaultWidget = {
        i: widgetTemplate.id,
        x: minX,
        y: 0,
        w: widgetTemplate.defaultSize?.w || 1,
        content: <div>New Widget: {widgetTemplate.title}</div>
      };
      widgetDefinitions[widgetTemplate.id as keyof typeof widgetDefinitions] = defaultWidget;
    }
  };

  const handleRemoveWidget = (widgetId: string) => {
    setActiveWidgets(activeWidgets.filter(id => id !== widgetId));
    event({
      action: 'remove_widget',
      category: 'Widget',
      label: widgetId
    });
  };

  function performMigrations() {
    migrateWidgetLayouts();
    migrateTasks(STORAGE_KEY);
  }

  useEffect(() => {
    if (!ensureValidWidgetLayouts()) {
      window.location.reload();
    }
  }, []);

  const ensureValidLayouts = () => {
    return ensureValidWidgetLayouts();
  };
  ensureValidLayouts();

  useEffect(() => {
    performMigrations();
  }, []);

  useEffect(() => {
    const checkDateChange = () => {
      const localDate = getLocalDate();
      const todayStr = format(localDate, 'yyyy-MM-dd');
      
      const lastKnownDate = currentDateRef.current;
      
      if (lastKnownDate !== todayStr) {
        console.log('Date change detected:', lastKnownDate, '->', todayStr);
        
        currentDateRef.current = todayStr;
        
        const isForwardDateChange = new Date(todayStr) > new Date(lastKnownDate);
        
        if (isForwardDateChange) {
          console.log('Forward date change detected, resetting tasks...');
          
          setTasks(prevTasks => {
            const repeatingTasksOnly = prevTasks
              .filter(task => task.isRepeating)
              .map(task => ({
                ...task,
                completed: false,
                lastCompleted: task.completed ? Date.now() : task.lastCompleted
              }));
            
            localStorage.setItem(LAST_SAVED_DATE_KEY, todayStr);
            
            const nonRepeatingCount = prevTasks.filter(task => !task.isRepeating).length;
            console.log(`Manual date change task reset: Removing ${nonRepeatingCount} non-repeating tasks, keeping ${repeatingTasksOnly.length} repeating tasks (now unchecked)`);
            
            return repeatingTasksOnly;
          });
        }
      }
    };
    
    const interval = setInterval(checkDateChange, 60000);
    
    checkDateChange();
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      const now = new Date();
      const today = new Date(now);
      if (now.getHours() < 5) {
        today.setDate(today.getDate() - 1);
      }
      const todayStr = format(today, 'yyyy-MM-dd');
      
      if (currentDateRef.current !== todayStr) {
        console.log(`Date changed while app was inactive: ${currentDateRef.current} -> ${todayStr}`);
        
        const isForwardDateChange = new Date(todayStr) > new Date(currentDateRef.current);
        
        currentDateRef.current = todayStr;
        
        if (isForwardDateChange) {
          console.log('Forward date change detected on window focus, resetting tasks...');
          
          setTasks(prevTasks => {
            const repeatingTasksOnly = prevTasks
              .filter(task => task.isRepeating)
              .map(task => ({
                ...task,
                completed: false,
                lastCompleted: task.completed ? Date.now() : task.lastCompleted
              }));
            
            localStorage.setItem(LAST_SAVED_DATE_KEY, todayStr);
            
            return repeatingTasksOnly;
          });
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Track initial page view
  useEffect(() => {
    pageview(window.location.pathname + window.location.search);
    // Initialize auto-backup
    setupAutoBackup(30); // Backup every 30 minutes
  }, []);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('latestUpdateVersion');
    if (lastSeenVersion !== UPDATE_VERSION) {
      openPopup('updateInfo', { version: UPDATE_VERSION, changelog: UPDATE_CHANGELOG });
    }
    // Only run this effect once on mount
    // eslint-disable-next-line
  }, []);

  // Auth popup for new/incognito users
  useEffect(() => {
    // Only show auth popup on initial load if no user and not guest
    if (!user && !isGuest) {
      console.log('Initial auth popup check - no user detected');
      closePopup();
      openPopup('auth');
    }
  }, [user, isGuest, openPopup, closePopup]);

  // Automatically close the auth popup when the user becomes authenticated (including after OAuth login).
  useEffect(() => {
    if (user && activePopup === 'auth') {
      closePopup();
    }
  }, [user, activePopup, closePopup]);

  // Set initial auth popup state
  useEffect(() => {
    const wasLoggedIn = localStorage.getItem('was-logged-in');
    if (wasLoggedIn === 'true' && !user) {
      // Show Sign In for users who have logged out
      if (document.querySelector('[data-auth-popup]')) {
        const event = new CustomEvent('show-signin');
        document.dispatchEvent(event);
      }
    }
    if (user) {
      localStorage.setItem('was-logged-in', 'true');
    }
  }, [user]);

  // Lazy load tasks from Supabase for logged-in users
  useEffect(() => {
    if (!user || isGuest) return;
    let cancelled = false;
    const fetchInitialTasks = async () => {
      setLoadingMoreTasks(true);
      const data = await downloadTasksFromSupabase(user.id);
      if (!cancelled) {
        setTasks(data);
        setHasMoreTasks(false);  // Since we're not using pagination anymore
        taskPageRef.current = 1;
        setLoadingMoreTasks(false);
      }
    };
    fetchInitialTasks();
    return () => { cancelled = true; };
  }, [user, isGuest]);

  // Infinite scroll: load more tasks when observer is visible
  useEffect(() => {
    if (!user || isGuest) return;
    if (!hasMoreTasks) return;
    if (!observerRef.current) return;
    let cancelled = false;
    const handleIntersect = async (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !loadingMoreTasks && hasMoreTasks) {
        setLoadingMoreTasks(true);
        const data = await downloadTasksFromSupabase(user.id);
        if (!cancelled) {
          setTasks(prev => [...prev, ...data]);
          setHasMoreTasks(false);
          taskPageRef.current += 1;
          setLoadingMoreTasks(false);
        }
      }
    };
    const observer = new window.IntersectionObserver(handleIntersect, { threshold: 1 });
    observer.observe(observerRef.current);
    return () => {
      observer.disconnect();
      cancelled = true;
    };
  }, [user, isGuest, hasMoreTasks, loadingMoreTasks]);

  // Logout functionality
  const handleLogout = async () => {
    setShowLogoutPopup(false);
    setShowUserMenu(false);
    
    // First navigate to get started page
    navigate('/get-started', { replace: true });
    
    // Clear all localStorage guest/user state
    localStorage.removeItem('guest-mode');
    
    // Small delay to ensure navigation completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Log out from Supabase
    await logout();
    
    // Force auth popup to show
    setForceShowAuthPopup(true);
    openPopup('auth');
  };

  // Delete account functionality
  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setShowDeletePopup(false);
      setShowUserMenu(false);

      // First navigate to get started page
      navigate('/get-started', { replace: true });
      
      // Small delay to ensure navigation completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Delete all user data
      await deleteUserAccount(user.id);
      
      // Delete the actual user account
      const { error } = await supabase.rpc('delete_user_data');
      
      if (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again or contact support.');
        return;
      }
      
      // Clear all local storage
      const keysToRemove = [
        'todo-tracker-tasks',
        'upcoming-events-data',
        'active-widgets',
        'theme',
        'quick-links',
        'pomodoroSettings',
        'guest-mode',
        'latestUpdateVersion',
        'todo-tracker-daily-data',
        'last-saved-date'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Log out and show auth popup
      await logout();
      setForceShowAuthPopup(true);
      openPopup('auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again or contact support.');
      setShowDeletePopup(true);
    }
  };

  // On /get-started, open auth popup if forceShowAuthPopup is true or if not authenticated/guest
  useEffect(() => {
    if (window.location.pathname === '/get-started' && (!user && !isGuest) && (forceShowAuthPopup || activePopup !== 'auth')) {
      openPopup('auth');
      setForceShowAuthPopup(false);
    }
  }, [forceShowAuthPopup, openPopup, user, isGuest, activePopup]);

  return (
    <PomodoroSettingsProvider>
      <Routes>
        <Route
          path="/get-started"
          element={
            <>
              <div className="min-h-screen bg-zinc-900 text-gray-900 dark:text-white p-3 sm:p-4 md:p-6 lg:p-8 font-ubuntu flex flex-col items-center justify-center">
                <main className="flex flex-col mt-10 items-center justify-center min-h-[60vh] text-center relative">
                  <RoughNotationGroup show={true}>
                    <h1 className="text-3xl md:text-6xl mb-5 sm:text-4xl tracking-tight space-x-2 font-bold text-slate-100">
                      <RoughNotation type="crossed-off" color="#ef4444" strokeWidth={3} padding={2} show={true}> <span className='text-zinc-500' >Hold Off</span></RoughNotation> Smash <RoughNotation type="box" color="#06b6d4" strokeWidth={3} padding={4} show={true}><span className="text-cyan-400">tasks</span></RoughNotation>.
                      Grind <RoughNotation type="underline" strokeWidth={5} color="#FFB75983" padding={[0,2]} show={true}><span className="text-[#F50056] ">LeetCode</span></RoughNotation>.
                      <br />
                      Plan your week. Keep your <span className="text-white">spark</span>.
                    </h1>
                  </RoughNotationGroup>
                  <section className="text-base font-normal mt-4 text-gray-600 mb-8 max-w-xl mx-auto">
                    <h2 className='text-xl text-gray-400 font-semibold'>Your Data, Your Nest</h2>
                    <p>We don't peek. Everything you do is stored locally on your device<br />
                    no clouds, no spying, just you and your productivity.</p>
                  </section>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-full text-lg shadow-lg transition-all duration-200"
                    onClick={() => navigate('/')}
                  >
                    Get Started
                  </button>
                </main>
                <div className="fixed bottom-8 left-8 flex flex-col items-center">
                  <div className="bg-yellow-100 text-yellow-900 rounded-xl px-4 py-2 mb-2 font-bold shadow-lg">You're Our Favorite Chick Today!</div>
                  <img src={welcomePenguin} alt="Chick" className="w-24 h-24" />
                </div>
              </div>
              {/* Auth popup always open on get started page if not authenticated or forced */}
              {(!user && !isGuest) && (
                <PopupManager />
              )}
            </>
          }
        />
        <Route path="/*" element={
      <div className="min-h-screen bg-zinc-900 text-gray-900 dark:text-white p-3 sm:p-4 md:p-6 lg:p-8 font-ubuntu">
            {/* Hamburger button for guest and authenticated users, popups, etc. */}
        {isGuest && (
          <button
            className="fixed top-4 right-4 z-[9999] p-2 rounded-lg bg-gradient-to-tr from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
            onClick={() => openPopup('auth')}
            aria-label="Open sign up popup"
            tabIndex={0}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        )}
            {/* Hamburger button for authenticated users (always visible) */}
            {user && !isGuest && (
              <div className="fixed top-4 right-4 z-[9999]">
                <button
                  className="p-2 rounded-lg bg-gradient-to-tr from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  aria-label="Open user menu"
                  tabIndex={0}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg py-2 animate-fade-in text-white">
                    <button className="w-full text-left px-4 py-2 hover:bg-zinc-700 transition-colors" onClick={() => { setShowLogoutPopup(true); setShowUserMenu(false); }}>Logout</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-red-600 transition-colors" onClick={() => { setShowDeletePopup(true); setShowUserMenu(false); }}>Delete Account</button>
                  </div>
                )}
              </div>
            )}
            {/* Logout Confirmation Popup */}
            {showLogoutPopup && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 w-full max-w-xs mx-auto border border-zinc-700 text-center relative">
                  <button
                    className="absolute top-3 right-3 z-60 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700/50 transition-colors shadow-[0_2px_8px_0_rgba(255,255,255,0.25)]"
                    style={{ zIndex: 60 }}
                    onClick={() => setShowLogoutPopup(false)}
                    aria-label="Close logout popup"
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h3 className="text-xl font-semibold mb-4 text-white">Confirm Logout</h3>
                  <p className="mb-6 text-gray-300">Are you sure you want to log out?</p>
                  <button className="w-full py-3 rounded-2xl bg-cyan-400 text-white font-semibold shadow-lg transition-all duration-200 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400" onClick={handleLogout}>Logout</button>
                </div>
              </div>
            )}
            {/* Delete Account Confirmation Popup */}
            {showDeletePopup && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 w-full max-w-xs mx-auto border border-zinc-700 text-center relative">
                  <button
                    className="absolute top-3 right-3 z-60 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700/50 transition-colors shadow-[0_2px_8px_0_rgba(255,255,255,0.25)]"
                    style={{ zIndex: 60 }}
                    onClick={() => setShowDeletePopup(false)}
                    aria-label="Close delete account popup"
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h3 className="text-xl font-semibold mb-4 text-white">Delete Account</h3>
                  <p className="mb-6 text-gray-300">Are you sure you want to delete your account permanently? This cannot be undone.</p>
                  <button className="w-full py-3 rounded-2xl bg-red-600 text-white font-semibold shadow-lg transition-all duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400" onClick={handleDeleteAccount}>Delete Account</button>
                </div>
              </div>
            )}
        {/* Remove direct rendering of StoreDataCard */}
        <header className="relative z-50 pt-4 pb-16">
          {widgets.length > 0 ? (
            <WidgetManager 
              widgets={widgets}
              onLayoutChange={() => {}}
              onRemoveWidget={handleRemoveWidget}
            />
          ) : (
            <main className="flex flex-col mt-10 items-center justify-center min-h-[60vh] text-center relative">
              <RoughNotationGroup show={true}>
                <h1 className="text-3xl md:text-6xl mb-5 sm:text-4xl tracking-tight space-x-2 font-bold text-slate-100">
                  <RoughNotation type="crossed-off" color="#ef4444" strokeWidth={3} padding={2} show={true}> <span className='text-zinc-500' >Hold Off</span></RoughNotation> Smash <RoughNotation type="box" color="#06b6d4" strokeWidth={3} padding={4} show={true}><span className="text-cyan-400">tasks</span></RoughNotation>.
                  Grind <RoughNotation type="underline" strokeWidth={5} color="#FFB75983" padding={[0,2]} show={true}><span className="text-[#F50056] ">LeetCode</span></RoughNotation>.
                  <br />
                  Plan your week. Keep your <span className="text-white">spark</span>.
                </h1>
              </RoughNotationGroup>
              <section className="text-base font-normal mt-4 text-gray-600 mb-8 max-w-xl mx-auto">
                <h2 className='text-xl text-gray-400 font-semibold'>Your Data, Your Nest</h2>
                <p>We don't peek. Everything you do is stored locally on your device<br />
                no clouds, no spying, just you and your productivity.</p>
              </section>
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-full text-lg shadow-lg transition-all duration-200"
                onClick={() => setShowWidgetSelector(true)}
              >
                Get Started
              </button>
              <img 
                src={welcomePenguin} 
                alt="Welcome to Doing - Your Productivity Platform" 
                className="w-56 h-56 md:w-72 md:h-72 sm:w-48 sm:h-48 fixed left-0 bottom-0 drop-shadow-xl pointer-events-none select-none" 
                style={{zIndex: 10}} 
              />
            </main>
          )}
        </header>
        
        <WidgetSelector onSelectWidget={handleAddWidget} />
        
        <PopupManager 
          onAddEvent={(event) => {
            const newEvent = {
              id: Date.now().toString(),
              ...event,
              color: event.color as 'red' | 'purple' | 'blue' | 'green' | 'orange'
            };
            
            import('./utils/eventUtils')
              .then(({ addEvent }) => {
                addEvent(newEvent);
              })
              .catch(err => {
                console.error('Error adding event:', err);
                const savedEvents = localStorage.getItem('upcoming-events-data');
                const events = savedEvents ? JSON.parse(savedEvents) : [];
                localStorage.setItem('upcoming-events-data', JSON.stringify([...events, newEvent]));
                
                const eventAddedEvent = new CustomEvent('event-added', {
                  detail: { event: newEvent }
                });
                window.dispatchEvent(eventAddedEvent);
              });
          }}
          onAddQuickLink={(link) => {
            const newQuickLink = {
              id: Date.now().toString(),
              title: link.title,
              url: link.url.startsWith('http') ? link.url : `https://${link.url}`
            };
            const prev = JSON.parse(localStorage.getItem('quick-links') || '[]');
            const updated = [...prev, newQuickLink];
            localStorage.setItem('quick-links', JSON.stringify(updated));
            setQuickLinksKey(k => k + 1);
          }}
        />

        <Dock appVersion={UPDATE_VERSION} />
        {/* Invisible observer for lazy loading tasks */}
        <div ref={observerRef} style={{ position: 'absolute', width: 1, height: 1, left: -9999, bottom: 0 }} />
      </div>
        } />
      </Routes>
    </PomodoroSettingsProvider>
  );
}

export default App;