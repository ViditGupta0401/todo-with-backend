import { useState, useMemo, useEffect, useRef } from 'react';
import { TaskList } from './components/TaskList';
import { Analytics } from './components/Analytics';
import { Heatmap } from './components/Heatmap';
import { QuickLinks } from './components/QuickLinks';
import { BMICalculator } from './components/BMICalculator';
import { useTheme } from './context/ThemeContext';
import Dock from './components/Dock'; // Import the Dock component
import WidgetManager, { Widget } from './components/WidgetManager'; // Import our new WidgetManager
import WidgetSelector, { WidgetTemplate } from './components/WidgetSelector'; // Import new WidgetSelector
import { useWidgetContext } from './context/WidgetContext';
import PomodoroWidget from './components/PomodoroTimer/PomodoroWidget'; // Import PomodoroWidget
import { PomodoroSettingsProvider } from './context/PomodoroSettingsContext';

import PopupManager from './components/popups/PopupManager'; // Import PopupManager
import type { Task, Filter } from './types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell } from '@fortawesome/free-solid-svg-icons';
import ClockWidget from './components/ClockWidget';
import UpcomingEventsWidget from './components/UpcomingEventsWidget';
import { migrateWidgetLayouts, migrateTasks, ensureValidWidgetLayouts } from './utils/migration';
import LeetCodeWidget from './components/LeetCodeWidget';

const STORAGE_KEY = 'todo-tracker-tasks';
const DAILY_DATA_KEY = 'todo-tracker-daily-data';
const LAST_SAVED_DATE_KEY = 'last-saved-date';

// Using Task type directly instead of a separate StoredTask interface
// No need for a separate storage format type

interface DailyData {
  date: string;
  completedTasks: number;
  totalTasks: number;
  completedTaskIds: string[];
  repeatingTaskIds: string[];
  nonRepeatingTaskIds: string[];
  completedTaskTexts?: { id: string; text: string; priority: 'high' | 'medium' | 'low' }[];
  remark?: string; // Add remark field
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  // Add this ref to track initial mount and prevent task clearing on refresh
  const isInitialRender = useRef(true);
  
  // Store the current date for detecting manual date changes
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
  // We only need selectedMonth for date-based features
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { theme } = useTheme();
  const [showBMI, setShowBMI] = useState<boolean>(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false); // Add state for filter dropdown
  
  // Use context for widget state
  const {
    activeWidgets,
    setActiveWidgets
  } = useWidgetContext();
  
  const [quickLinksKey, setQuickLinksKey] = useState(0); // To force re-render

  // Function to update daily data
  const updateDailyData = (currentTasks: Task[], isInitializing = false) => {
    const now = new Date();
    const today = new Date(now);
    if (now.getHours() < 5) {
      today.setDate(today.getDate() - 1);
    }
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Check for manual date changes
    if (currentDateRef.current !== todayStr) {
      console.log(`Date has changed: ${currentDateRef.current} -> ${todayStr}`);
      currentDateRef.current = todayStr;
    }
    
    console.log(`${isInitializing ? 'Initializing' : 'Updating'} daily data for:`, todayStr);
    
    // Log the task composition for debugging
    const repeatingCount = currentTasks.filter(task => task.isRepeating).length;
    const nonRepeatingCount = currentTasks.filter(task => !task.isRepeating).length;
    const completedCount = currentTasks.filter(task => task.completed).length;
    
    console.log(`Task composition: ${repeatingCount} repeating, ${nonRepeatingCount} non-repeating, ${completedCount} completed`);
    
    // Get repeating task IDs - only tasks marked as repeating
    const repeatingTaskIds = currentTasks
      .filter(task => task.isRepeating)
      .map(task => task.id);
    
    // Get non-repeating task IDs - only tasks marked as non-repeating
    const nonRepeatingTaskIds = currentTasks
      .filter(task => !task.isRepeating)
      .map(task => task.id);
    
    // Get all completed tasks (both repeating and non-repeating)
    const completedTaskIds = currentTasks
      .filter(task => task.completed)
      .map(task => task.id);
    
    // Calculate total tasks (both repeating and non-repeating)
    // For normal updates, include all tasks. For day initialization, only include repeating tasks
    const totalTasksForToday = isInitializing ? 
      repeatingTaskIds.length : 
      repeatingTaskIds.length + nonRepeatingTaskIds.length;
    
    // Get texts of completed tasks for history
    const completedTaskTexts = currentTasks
      .filter(task => task.completed)
      .map(task => ({
        id: task.id,
        text: task.text,
        priority: task.priority
      }));
    
    // When initializing a new day, we don't carry over any completed task texts
    
    // Update daily data
    setDailyData(prevData => {
      const existingDayIndex = prevData.findIndex(d => d.date === todayStr);
      if (existingDayIndex >= 0) {
        const newData = [...prevData];
        // Keep any existing completed task history when updating
        const existingCompletedTexts = newData[existingDayIndex].completedTaskTexts || [];
        
        newData[existingDayIndex] = {
          ...newData[existingDayIndex],
          completedTasks: completedTaskIds.length,
          totalTasks: totalTasksForToday,
          completedTaskIds: completedTaskIds,
          repeatingTaskIds: repeatingTaskIds,
          nonRepeatingTaskIds: nonRepeatingTaskIds,
          completedTaskTexts: isInitializing
            ? completedTaskTexts // Don't add previous day's history on initialization
            : [...existingCompletedTexts, ...completedTaskTexts.filter(newTask => 
                !existingCompletedTexts.some(existingTask => existingTask.id === newTask.id)
              )] // Add only new completed tasks
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
          completedTaskTexts: completedTaskTexts // Don't include previous day's history
        };
        return [...prevData, newDayData];
      }
    });
  };
  // Load tasks from localStorage on mount (single source of truth)
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      console.log('Loading tasks from localStorage:', savedTasks);
      
      if (savedTasks) {
        // Parse and convert fields to match Task type
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
          // More aggressive check for day changes, including manual system date changes
          const now = new Date();
          const today = new Date(now);
          if (now.getHours() < 5) {
            today.setDate(today.getDate() - 1);
          }
          const todayStr = format(today, 'yyyy-MM-dd');
          
          // Get the last saved date
          const lastSavedDate = localStorage.getItem(LAST_SAVED_DATE_KEY);
          
          // Update our current date reference
          currentDateRef.current = todayStr;
          
          // Force a reset if there's no saved date or if the date has changed
          // This ensures we always start a new day with only repeating tasks that are unchecked
          const needsReset = !lastSavedDate || lastSavedDate !== todayStr;
          
          console.log('Last saved date:', lastSavedDate, 'Current date:', todayStr, 'Needs reset:', needsReset);
          
          if (needsReset) {
            // On day change or first load, only keep repeating tasks and reset them to unchecked
            const repeatingTasksOnly = parsedTasks
              .filter((task: Task) => task.isRepeating)
              .map((task: Task) => ({
                ...task,
                completed: false // Always start with all repeating tasks unchecked
              }));
            
            const nonRepeatingCount = parsedTasks.filter((task: Task) => !task.isRepeating).length;
            console.log(`Day changed - Filtered out ${nonRepeatingCount} non-repeating tasks, kept ${repeatingTasksOnly.length} repeating tasks (reset to unchecked)`);
            
            setTasks(repeatingTasksOnly);
            
            // Store current date as last saved date
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
  // Save tasks to localStorage whenever they change
  useEffect(() => {
    try {
      // Only save if tasks is not empty and fully initialized
      if (tasks.length > 0 || localStorage.getItem(STORAGE_KEY) === null) {
        console.log('Saving tasks to localStorage:', tasks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      }
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks]);
  
  // Initialize daily data for today on first load
  useEffect(() => {
    // Only run if tasks are loaded and we have the function available
    if (tasks.length === 0) return;
    
    const now = new Date();
    const today = new Date(now);
    if (now.getHours() < 5) {
      today.setDate(today.getDate() - 1);
    }
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Always update our current date reference
    currentDateRef.current = todayStr;
    
    // Check if we already have an entry for today
    const hasTodayEntry = dailyData.some(d => d.date === todayStr);
    
    // If we don't have today's entry yet, create it
    if (!hasTodayEntry) {
      console.log('Auto-initializing daily data for today:', todayStr);
      
      // When initializing, only include repeating tasks
      // These should match what we've loaded from localStorage after filtering
      const repeatingTaskIds = tasks
        .filter(task => task.isRepeating)
        .map(task => task.id);
      
      // For new day initialization, we're not carrying over history from previous day
      
      // We don't need previous day's completed task texts for a new day
      
      // Since we're initializing a new day or we had a day change,
      // there should be no non-repeating tasks in our tasks array now
      const nonRepeatingTaskIds: string[] = []; // Empty array for new day
      
      setDailyData(prevData => {
        const newDayData = {
          date: todayStr,
          completedTasks: 0 // Start with 0 completed tasks for the new day
          ,
          totalTasks: repeatingTaskIds.length,  // Only count repeating tasks in total
          completedTaskIds: [], // Start with empty completedTaskIds for new day
          repeatingTaskIds: repeatingTaskIds,
          nonRepeatingTaskIds: nonRepeatingTaskIds, // Empty array for new day
          completedTaskTexts: [] // Start with empty completedTaskTexts for new day
        };
        return [...prevData, newDayData];
      });
    }
  }, [tasks, dailyData]);

  // Save daily data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(DAILY_DATA_KEY, JSON.stringify(dailyData));
    } catch (error) {
      console.error('Error saving daily data to localStorage:', error);
    }
  }, [dailyData]);  // Check for day change and reset tasks at 5 AM (not midnight)
  useEffect(() => {
    // Don't run task reset logic on first render to prevent clearing tasks on refresh
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    const checkDayChange = () => {
      const now = new Date();
      
      // Only perform reset at 5 AM
      if (now.getHours() === 5 && now.getMinutes() === 0) {
        console.log('5 AM detected, resetting tasks for the new day');
        
        const currentDate = format(now, 'yyyy-MM-dd');
        const previousDate = format(new Date(new Date().setDate(now.getDate() - 1)), 'yyyy-MM-dd');
        
        // Save the current date
        localStorage.setItem(LAST_SAVED_DATE_KEY, currentDate);
        
        // Get yesterday's data for updating completed tasks history
        const yesterdayData = dailyData.find(d => d.date === previousDate);
        
        // First, save all completed tasks (both repeating and non-repeating) to history
        if (yesterdayData) {
          // Get all tasks from yesterday (both repeating and non-repeating)
          const allYesterdayTasks = tasks.filter(task => 
            (task.isRepeating && yesterdayData.repeatingTaskIds.includes(task.id)) || 
            (!task.isRepeating && yesterdayData.nonRepeatingTaskIds.includes(task.id))
          );
          
          // Get completed task data for history
          const allCompletedTasks = allYesterdayTasks
            .filter(task => task.completed)
            .map(task => ({
              id: task.id,
              text: task.text,
              priority: task.priority
            }));
          
          // Only update if there are completed tasks to save
          if (allCompletedTasks.length > 0) {
            setDailyData(prevData => {
              const updatedData = [...prevData];
              const yesterdayIndex = updatedData.findIndex(d => d.date === previousDate);
              
              if (yesterdayIndex >= 0) {
                // Ensure we don't add duplicate entries
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
        
        // Filter out repeating tasks first so we can use them for both state updates
        console.log('Tasks before 5 AM reset:', tasks);
        
        const repeatingTasksList = tasks
          .filter(task => task.isRepeating)
          .map(task => ({
            ...task,
            completed: false, // Always reset to incomplete
            lastCompleted: task.completed ? Date.now() : task.lastCompleted // Track last completion time
          }));
        
        console.log('Tasks after 5 AM reset (repeating tasks only, unchecked):', repeatingTasksList);
          
        const resetDate = format(new Date(), 'yyyy-MM-dd');
        console.log('Resetting tasks for date:', resetDate);
        
        // Count tasks before filtering for logging
        const nonRepeatingCount = tasks.filter(task => !task.isRepeating).length;
        const repeatingCount = repeatingTasksList.length;
        
        console.log(`Task reset summary: Kept ${repeatingCount} repeating tasks (now incomplete), removed ${nonRepeatingCount} non-repeating tasks`);
        
        // Update tasks state with only repeating tasks
        setTasks(repeatingTasksList);
        
        // Create a new day entry in daily data for today
        setDailyData(prevData => {
          // Use the filtered repeatingTasksList for IDs, not the original tasks array
          const repeatingTaskIds = repeatingTasksList.map(task => task.id);
          
          // We don't need to carry over any completed task history for the next day
          // All tasks start as incomplete in the new day
            
          const existingDayIndex = prevData.findIndex(d => d.date === currentDate);
          
          if (existingDayIndex >= 0) {
            // Update existing day entry for today
            const newData = [...prevData];
            newData[existingDayIndex] = {
              ...newData[existingDayIndex],
              completedTasks: 0, // Reset completed count
              completedTaskIds: [], // Reset completed IDs
              repeatingTaskIds: repeatingTaskIds, 
              nonRepeatingTaskIds: [], // No non-repeating tasks on day reset
              totalTasks: repeatingTaskIds.length,
              // Don't preserve any completed task history - start fresh
              completedTaskTexts: []
            };
            return newData;
          } else {
            // Create new day entry for today
            return [...prevData, {
              date: currentDate,
              completedTasks: 0, // Reset completed count
              totalTasks: repeatingTaskIds.length,
              completedTaskIds: [], // Reset completed IDs
              repeatingTaskIds: repeatingTaskIds,
              nonRepeatingTaskIds: [],
              // Start with an empty completedTaskTexts array for the new day
              completedTaskTexts: []
            }];
          }
        });
      }
    };

    // Only set up the interval for checking 5AM reset if we have loaded tasks
    // Don't call the function immediately to prevent reset on load
    const interval = setInterval(checkDayChange, 60000);

    return () => clearInterval(interval);
  }, [tasks, dailyData]);
  // No need to update time every second since we're not displaying a clock
  // Removed the unused setCurrentTime interval

  // Filter tasks to show all tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    });  }, [tasks, filter]);

  // Calculate real heatmap data for the selected month
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

  // Calculate real analytics data
  const analyticsData = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    if (now.getHours() < 5) {
      today.setDate(today.getDate() - 1);
    }
    const todayStr = format(today, 'yyyy-MM-dd');

    // Get all days with completed tasks
    const activeDays = dailyData.filter(day => day.completedTasks > 0);
    
    // Sort days in descending order (most recent first)
    const sortedDays = [...activeDays].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate current streak - counting consecutive days up to today
    let currentStreak = 0;
    let checkDate = new Date(todayStr);
    
    // Check if we have activity today first
    const todayActivity = sortedDays.find(day => day.date === todayStr);
    if (todayActivity) {
      currentStreak = 1; // Start with 1 for today
      
      // Now check previous days consecutively
      for (let i = 1; i <= 366; i++) { // Check up to a year back
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = format(prevDate, 'yyyy-MM-dd');
        
        // Check if this previous date exists in our active days
        const hasPrevDay = sortedDays.some(day => day.date === prevDateStr);
        
        if (hasPrevDay) {
          currentStreak++;
          checkDate = prevDate; // Move to check the next previous day
        } else {
          break; // Break the streak when we find a day with no activity
        }
      }
    }
    
    // Calculate longest streak
    let longestStreak = currentStreak;
    let tempStreak = 0;
    
    // Sort days in ascending order for longest streak calculation
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
          tempStreak = 1; // Reset streak when there's a gap
        }
      }
      
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // Calculate completion rate for all tasks (both repeating and non-repeating)
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

  const addTask = (text: string, priority: Task['priority'], isRepeating: boolean = false) => {
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
    
    // Add the task to the tasks array
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    
    // Manually update daily data to ensure it's updated immediately
    updateDailyData(updatedTasks, false);
  };

  const toggleTask = (id: string) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
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

      // Manually update daily data to ensure it's updated immediately
      updateDailyData(updatedTasks, false);
      
      return updatedTasks;
    });
  };

  const deleteTask = (id: string) => {
    // Remove the task from the tasks array
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    
    // Manually update daily data to ensure it's updated immediately
    updateDailyData(updatedTasks, false);
  };

  const updateTask = (id: string, text: string) => {
    if (!text.trim()) return; // Don't update if text is empty or only whitespace
    
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, text: text.trim() } : task
    ));
  };
  // Helper: reorder tasks
  const reorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
  };
  
  // Handle layout related functions here if needed
  // Define all available widgets that can be displayed
  const widgetDefinitions = {
    quickLinks: {
      i: 'quickLinks',
      x: 0, // Column 0
      y: 0, // Row 0
      w: 1, // Width: 1 column
      content: <QuickLinks key={quickLinksKey} />
    },
    todoList: {
      i: 'todoList',
      x: 1, // Column 1
      y: 0, // Row 0
      w: 2, // Width: 2 columns
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
            onAddClick={addTask} // Pass addTask directly
          />
        </div>
      )
    },
    analytics: {
      i: 'analytics',
      x: 3, // Column 3
      y: 0, // Row 0
      w: 1, // Width: 1 column
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
      x: 3, // Column 3
      y: 1, // Row 1
      w: 1, // Width: 1 column
      content: <UpcomingEventsWidget />
    },
    clock: {
      i: 'clock',
      x: 0,
      y: 1,
      w: 1, // Set to 1 column width
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
      x: 0, // You can adjust the position as needed
      y: 2,
      w: 2, // You can adjust the width as needed
      content: <LeetCodeWidget />
    }
  };

  // Filter active widgets based on activeWidgets state
  const widgets: Widget[] = activeWidgets
    .filter(id => widgetDefinitions[id as keyof typeof widgetDefinitions])
    .map(id => widgetDefinitions[id as keyof typeof widgetDefinitions]);
  
  // Handle adding a new widget
  const handleAddWidget = (widgetTemplate: WidgetTemplate) => {
    // Only add if the widget isn't already active
    if (!activeWidgets.includes(widgetTemplate.id)) {
      setActiveWidgets([...activeWidgets, widgetTemplate.id]);

      // Find the leftmost column (min x among all widgets)
      const widgetList = Object.values(widgetDefinitions);
      let minX = 0;
      if (widgetList.length > 0) {
        minX = Math.min(...widgetList.map(w => w.x));
      }
      // Find all widgets in the leftmost column
      // const leftColWidgets = widgetList.filter(w => w.x === minX); // Removed unused variable
      // Add the new widget at y=0
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

  // Handle removing a widget
  const handleRemoveWidget = (widgetId: string) => {
    // Remove the widget from active widgets
    setActiveWidgets(activeWidgets.filter(id => id !== widgetId));
  };

  // Add link handler for popup system
  const handleAddQuickLink = (link: { title: string; url: string }) => {
    const newQuickLink = {
      id: Date.now().toString(),
      title: link.title,
      url: link.url.startsWith('http') ? link.url : `https://${link.url}`
    };
    const prev = JSON.parse(localStorage.getItem('quick-links') || '[]');
    const updated = [...prev, newQuickLink];
    localStorage.setItem('quick-links', JSON.stringify(updated));
    setQuickLinksKey(k => k + 1); // Force QuickLinks to re-render
  };

  // --- MIGRATION HELPERS ---
  function performMigrations() {
    // Use the utility functions from migration.ts
    migrateWidgetLayouts();
    migrateTasks(STORAGE_KEY);
  }

  // --- FORCE LAYOUT RESET IF INVALID ---
  useEffect(() => {
    // Check if layouts are valid, if not, reload the page
    if (!ensureValidWidgetLayouts()) {
      window.location.reload();
    }
  }, []);

  // --- FINAL: ENSURE LAYOUTS IS ALWAYS VALID BEFORE RENDER ---
  // This will run before rendering WidgetManager and fix any undefined or empty layouts
  const ensureValidLayouts = () => {
    return ensureValidWidgetLayouts();
  };
  ensureValidLayouts();

  // Run migrations and ensure valid layouts on component mount
  useEffect(() => {
    performMigrations();
  }, []);

  // Check for manual date changes (e.g., through system settings)
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const today = new Date(now);
      // Apply the 5 AM logic consistently
      if (now.getHours() < 5) {
        today.setDate(today.getDate() - 1);
      }
      const todayStr = format(today, 'yyyy-MM-dd');
      
      const lastKnownDate = currentDateRef.current;
      
      // If the date has changed since our last check
      if (lastKnownDate !== todayStr) {
        console.log('Date change detected:', lastKnownDate, '->', todayStr);
        
        // Update our reference date
        currentDateRef.current = todayStr;
        
        // Only reset tasks if it's a forward date change (not going back in time)
        const isForwardDateChange = new Date(todayStr) > new Date(lastKnownDate);
        
        if (isForwardDateChange) {
          console.log('Forward date change detected, resetting tasks...');
          
          // Reset the tasks: keep only repeating tasks and uncheck them
          setTasks(prevTasks => {
            const repeatingTasksOnly = prevTasks
              .filter(task => task.isRepeating)
              .map(task => ({
                ...task,
                completed: false,
                lastCompleted: task.completed ? Date.now() : task.lastCompleted
              }));
            
            // Save the new date
            localStorage.setItem(LAST_SAVED_DATE_KEY, todayStr);
            
            // Log the task reset
            const nonRepeatingCount = prevTasks.filter(task => !task.isRepeating).length;
            console.log(`Manual date change task reset: Removing ${nonRepeatingCount} non-repeating tasks, keeping ${repeatingTasksOnly.length} repeating tasks (now unchecked)`);
            
            return repeatingTasksOnly;
          });
        }
      }
    };
    
    // Check every minute for date changes
    const interval = setInterval(checkDateChange, 60000);
    
    // Also check immediately on mount
    checkDateChange();
    
    return () => clearInterval(interval);
  }, []);

  // Check for date changes when the window regains focus
  // This helps catch manual date changes while the app was in the background
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
        
        // Only reset tasks if it's a forward date change (not going back in time)
        const isForwardDateChange = new Date(todayStr) > new Date(currentDateRef.current);
        
        // Update our reference date
        currentDateRef.current = todayStr;
        
        if (isForwardDateChange) {
          console.log('Forward date change detected on window focus, resetting tasks...');
          
          // Reset the tasks: keep only repeating tasks and uncheck them
          setTasks(prevTasks => {
            const repeatingTasksOnly = prevTasks
              .filter(task => task.isRepeating)
              .map(task => ({
                ...task,
                completed: false,
                lastCompleted: task.completed ? Date.now() : task.lastCompleted
              }));
            
            // Save the new date
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
  
  return (
    <PomodoroSettingsProvider>
      <div className="min-h-screen bg-zinc-900 text-gray-900 dark:text-white p-3 sm:p-4 md:p-6 lg:p-8 font-ubuntu">
        {/* Container for all widgets in grid layout */}
        <div className="relative z-50 pt-4 pb-16">
          {widgets.length > 0 ? (
            <WidgetManager 
              widgets={widgets}
              onLayoutChange={() => {}}
              onRemoveWidget={handleRemoveWidget}
            />
          ) : (
            <div className="text-center text-gray-400 py-12">No widgets to display.</div>
          )}
        </div>
        
        {/* Widget Selector Modal */}
        <WidgetSelector onSelectWidget={handleAddWidget} />
        
        {/* Centralized PopupManager for all modal popups */}
        <PopupManager 
          onAddEvent={(event) => {
            // Use the shared event utility function to add the event
            const newEvent = {
              id: Date.now().toString(),
              ...event,
              // Ensure color is a valid EventColor type
              color: event.color as 'red' | 'purple' | 'blue' | 'green' | 'orange'
            };
            
            // Add event to storage using our utility function
            // The storage event listener in UpcomingEventsWidget will handle the update
            import('./utils/eventUtils')
              .then(({ addEvent }) => {
                addEvent(newEvent);
                // No need to dispatch custom event - the storage event will handle it
              })
              .catch(err => {
                console.error('Error adding event:', err);
                // Fallback if import fails
                const savedEvents = localStorage.getItem('upcoming-events-data');
                const events = savedEvents ? JSON.parse(savedEvents) : [];
                localStorage.setItem('upcoming-events-data', JSON.stringify([...events, newEvent]));
                
                // Dispatch the custom event only in fallback case
                // when we don't have the utility function's storage event
                const eventAddedEvent = new CustomEvent('event-added', {
                  detail: { event: newEvent }
                });
                window.dispatchEvent(eventAddedEvent);
              });
          }}
          onAddQuickLink={handleAddQuickLink}
        />      {/* Footer with developer attribution */}
        {/* <footer className="mt-8 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
          Made by <a 
            href="https://www.piyushdev.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#ff4101] hover:underline transition-all"
          >
            Piyush
          </a>
        </footer> */}

        {/* Dock at the bottom right corner */}
        <Dock />
      </div>
    </PomodoroSettingsProvider>
  );
}

export default App;