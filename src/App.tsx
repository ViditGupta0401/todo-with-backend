import { useState, useMemo, useEffect } from 'react';
import { TaskInput } from './components/TaskInput';
import { TaskList } from './components/TaskList';
import { Analytics } from './components/Analytics';
import { Heatmap } from './components/Heatmap';
import { QuickLinks } from './components/QuickLinks';
import { BMICalculator } from './components/BMICalculator';
import { useTheme } from './context/ThemeContext';
import type { Task, Filter } from './types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import logo from './doing logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell } from '@fortawesome/free-solid-svg-icons';
import AnimatedCounter from './components/AnimatedCounter';

const STORAGE_KEY = 'todo-tracker-tasks';
const DAILY_DATA_KEY = 'todo-tracker-daily-data';

interface StoredTask {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  timestamp: string;
  isRepeating: boolean;
  lastCompleted?: string;
}

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
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Load tasks from localStorage on initial render
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks) as StoredTask[];
        const now = new Date();
        const today = new Date(now);
        if (now.getHours() < 5) {
          today.setDate(today.getDate() - 1);
        }
        const todayStr = format(today, 'yyyy-MM-dd');

        // Get the daily data to check completed tasks
        const savedDailyData = localStorage.getItem(DAILY_DATA_KEY);
        let completedTaskIds: string[] = [];
        if (savedDailyData) {
          const dailyDataArray = JSON.parse(savedDailyData) as DailyData[];
          const todayData = dailyDataArray.find(data => data.date === todayStr);
          completedTaskIds = todayData?.completedTaskIds || [];
        }

        // Convert timestamp strings back to numbers and ensure all required fields
        return parsedTasks.map(task => ({
          ...task,
          timestamp: Number(task.timestamp),
          lastCompleted: task.lastCompleted ? Number(task.lastCompleted) : undefined,
          isRepeating: task.isRepeating || false,
          priority: task.priority || 'medium',
          // Only mark as completed if it's in the completedTaskIds array
          completed: completedTaskIds.includes(task.id)
        }));
      } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        return [];
      }
    }
    return [];
  });

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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { theme } = useTheme();
  const [showBMI, setShowBMI] = useState<boolean>(false);

  // Function to update daily data
  const updateDailyData = (currentTasks: Task[]) => {
    const now = new Date();
    const today = new Date(now);
    if (now.getHours() < 5) {
      today.setDate(today.getDate() - 1);
    }
    const todayStr = format(today, 'yyyy-MM-dd');
    console.log('Updating daily data for:', todayStr);
    
    // Get repeating task IDs
    const repeatingTaskIds = currentTasks
      .filter(task => task.isRepeating)
      .map(task => task.id);
    
    // Get non-repeating task IDs - include all non-repeating tasks
    const nonRepeatingTaskIds = currentTasks
      .filter(task => !task.isRepeating)
      .map(task => task.id);
    
    // Get all completed tasks (both repeating and non-repeating)
    const completedTaskIds = currentTasks
      .filter(task => task.completed)
      .map(task => task.id);
    
    // Calculate total tasks (both repeating and non-repeating)
    const totalTasksForToday = repeatingTaskIds.length + nonRepeatingTaskIds.length;
    
    // Get texts of completed tasks for history
    const completedTaskTexts = currentTasks
      .filter(task => completedTaskIds.includes(task.id))
      .map(task => ({
        id: task.id,
        text: task.text,
        priority: task.priority
      }));
    
    // Update daily data
    setDailyData(prevData => {
      const existingDayIndex = prevData.findIndex(d => d.date === todayStr);
      if (existingDayIndex >= 0) {
        const newData = [...prevData];
        newData[existingDayIndex] = {
          ...newData[existingDayIndex],
          completedTasks: completedTaskIds.length,
          totalTasks: totalTasksForToday,
          completedTaskIds: completedTaskIds,
          repeatingTaskIds: repeatingTaskIds,
          nonRepeatingTaskIds: nonRepeatingTaskIds,
          completedTaskTexts: completedTaskTexts
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

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      // Update daily data whenever tasks change
      updateDailyData(tasks);
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks]);

  // Save daily data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(DAILY_DATA_KEY, JSON.stringify(dailyData));
    } catch (error) {
      console.error('Error saving daily data to localStorage:', error);
    }
  }, [dailyData]);

  // Check for day change and reset tasks at 5 AM (not midnight)
  useEffect(() => {
    const checkDayChange = () => {
      const now = new Date();
      
      // Only perform reset at 5 AM
      if (now.getHours() === 5 && now.getMinutes() === 0) {
        console.log('5 AM detected, resetting tasks for the new day');
        
        const currentDate = format(now, 'yyyy-MM-dd');
        const previousDate = format(new Date(now.setDate(now.getDate() - 1)), 'yyyy-MM-dd');
        
        // Save the current date
        localStorage.setItem('last-saved-date', currentDate);
        
        // Get yesterday's data for updating completed tasks history
        const yesterdayData = dailyData.find(d => d.date === previousDate);
        
        // Create history of completed non-repeating tasks before removing them
        if (yesterdayData) {
          const nonRepeatingTasks = tasks.filter(task => !task.isRepeating && yesterdayData.nonRepeatingTaskIds.includes(task.id));
          
          // Update yesterday's completedTaskTexts with non-repeating tasks info
          if (nonRepeatingTasks.length > 0) {
            setDailyData(prevData => {
              const updatedData = [...prevData];
              const yesterdayIndex = updatedData.findIndex(d => d.date === previousDate);
              
              if (yesterdayIndex >= 0) {
                const completedTaskTexts = nonRepeatingTasks
                  .filter(task => task.completed)
                  .map(task => ({
                    id: task.id,
                    text: task.text,
                    priority: task.priority
                  }));
                
                updatedData[yesterdayIndex] = {
                  ...updatedData[yesterdayIndex],
                  completedTaskTexts: [
                    ...(updatedData[yesterdayIndex].completedTaskTexts || []),
                    ...completedTaskTexts
                  ]
                };
              }
              
              return updatedData;
            });
          }
        }
        
        // Reset completed status for repeating tasks and remove non-repeating tasks
        setTasks(prevTasks => {
          const now = new Date();
          const resetDate = format(now, 'yyyy-MM-dd');
          console.log('Resetting tasks for date:', resetDate);
          
          // Keep only repeating tasks and reset their completed status
          const repeatingTasks = prevTasks
            .filter(task => task.isRepeating)
            .map(task => ({
              ...task,
              completed: false,
              lastCompleted: task.completed ? task.timestamp : task.lastCompleted
            }));
            
          console.log('Kept repeating tasks:', repeatingTasks.length);
          console.log('Removed non-repeating tasks:', prevTasks.length - repeatingTasks.length);
          
          return repeatingTasks;
        });
        
        // Create a new day entry in daily data for today
        setDailyData(prevData => {
          const repeatingTaskIds = tasks
            .filter(task => task.isRepeating)
            .map(task => task.id);
            
          const existingDayIndex = prevData.findIndex(d => d.date === currentDate);
          
          if (existingDayIndex >= 0) {
            // Update existing day
            const newData = [...prevData];
            newData[existingDayIndex] = {
              ...newData[existingDayIndex],
              completedTasks: 0,
              completedTaskIds: [],
              repeatingTaskIds: repeatingTaskIds,
              nonRepeatingTaskIds: [],
              totalTasks: repeatingTaskIds.length
            };
            return newData;
          } else {
            // Create new day
            return [...prevData, {
              date: currentDate,
              completedTasks: 0,
              totalTasks: repeatingTaskIds.length,
              completedTaskIds: [],
              repeatingTaskIds: repeatingTaskIds,
              nonRepeatingTaskIds: []
            }];
          }
        });
      }
    };

    // Check every minute
    const interval = setInterval(checkDayChange, 60000);
    checkDayChange(); // Initial check

    return () => clearInterval(interval);
  }, [tasks, dailyData]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        const savedDailyData = localStorage.getItem(DAILY_DATA_KEY);

        // First load daily data to get completed tasks
        let completedTaskIds: string[] = [];
        if (savedDailyData) {
          const parsedDailyData = JSON.parse(savedDailyData);
          setDailyData(parsedDailyData);
          console.log('Loaded daily data from localStorage:', parsedDailyData);

          // Get today's completed tasks
          const now = new Date();
          const today = new Date(now);
          if (now.getHours() < 5) {
            today.setDate(today.getDate() - 1);
          }
          const todayStr = format(today, 'yyyy-MM-dd');
          const todayData = parsedDailyData.find((d: DailyData) => d.date === todayStr);
          completedTaskIds = todayData?.completedTaskIds || [];
          console.log('Today\'s completed task IDs:', completedTaskIds);
        }

        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks) as StoredTask[];
          const tasks = parsedTasks.map(task => ({
            ...task,
            timestamp: Number(task.timestamp),
            lastCompleted: task.lastCompleted ? Number(task.lastCompleted) : undefined,
            isRepeating: task.isRepeating || false,
            priority: task.priority || 'medium',
            // Only mark as completed if it's in today's completedTaskIds
            completed: completedTaskIds.includes(task.id)
          }));
          setTasks(tasks);
          console.log('Loaded tasks from localStorage:', tasks);
        }
        
        // Initialize last-saved-date if it doesn't exist
        const currentDate = format(new Date(), 'yyyy-MM-dd');
        if (!localStorage.getItem('last-saved-date')) {
          localStorage.setItem('last-saved-date', currentDate);
          console.log('Initialized last-saved-date:', currentDate);
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    };

    loadData();
  }, []);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Filter tasks to show all tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    });
  }, [tasks, filter]);

  // Calculate remaining tasks for today
  const remainingTasks = useMemo(() => {
    return tasks.filter(task => !task.completed).length;
  }, [tasks]);

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
    updateDailyData(updatedTasks);
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
      updateDailyData(updatedTasks);
      
      return updatedTasks;
    });
  };

  const deleteTask = (id: string) => {
    // Remove the task from the tasks array
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    
    // Manually update daily data to ensure it's updated immediately
    updateDailyData(updatedTasks);
  };

  const updateTask = (id: string, text: string) => {
    if (!text.trim()) return; // Don't update if text is empty or only whitespace
    
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, text: text.trim() } : task
    ));
  };

  const reorderTasks = (newTasks: Task[]) => {
    // Update the order of all tasks, not just filtered ones
    setTasks(newTasks);
  };

  return (
    <div className="min-h-screen dark:bg-[#18181c] bg-gray-100 text-gray-900 dark:text-white p-3 sm:p-4 md:p-6 lg:p-8 font-ubuntu">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-6 gap-4 lg:gap-6 min-h-[calc(100vh-2rem)]">
        <div className="col-span-1 lg:col-span-4 flex flex-col overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col items-start gap-2 mb-3 sm:mb-0">
              <img 
                src={logo} 
                className={`-m-3 w-[10rem] ${theme === 'light' ? 'filter invert' : ''}`} 
                alt="Doing Logo" 
              />
              <span className="font-medium text-sm sm:text-base">
                {remainingTasks > 0 ? (
                  <span>
                    Quick heads-up! Just <span className="text-orange-600 dark:text-orange-400 font-semibold">{remainingTasks} {remainingTasks === 1 ? 'task' : 'tasks'}</span> to power through today ✨
                  </span>
                ) : (
                  <span>
                    Hurrah!🎉 You have <span className="text-blue-600 dark:text-blue-400 font-semibold">Finished</span> All Task 👍
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-col text-center sm:text-right text-gray-900 dark:text-gray-400">
              <span className="font-semibold text-2xl sm:text-3xl md:text-4xl font-mono tracking-tight">
                <AnimatedCounter 
                  value={format(currentTime, 'hh:mm:ss a')}
                  digitClassName="font-mono"
                  separatorClassName="px-0.5"
                  separators={[':', ' ', 'a', 'p', 'm']}
                />
              </span>
              <span className='text-gray-900 dark:text-zinc-400/50 text-xs sm:text-sm'>{format(currentTime, 'EEEE, MMMM d, yyyy')}</span>
            </div>
          </div>

          <QuickLinks />
          
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
            {(['all', 'active', 'completed'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-2xl transition-all ${
                  filter === f ? 'bg-[#ff4101] text-white' : 'bg-gray-200 dark:bg-[#222126] text-gray-700 dark:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <TaskInput onAddTask={addTask} />
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
          <TaskList
            tasks={filteredTasks}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onUpdateTask={updateTask}
            onReorderTasks={reorderTasks}
          />
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 h-fit bg-white dark:bg-[#222126] p-3 sm:p-4 md:p-6 shadow-xl rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-y-auto custom-scrollbar mt-4 lg:mt-0">
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
                </svg>
              ) : (
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
      </div>

      {/* Footer with developer attribution */}
      <footer className="mt-8 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
        Made by <a 
          href="https://www.piyushdev.me" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#ff4101] hover:underline transition-all"
        >
          Piyush
        </a>
      </footer>
    </div>
  );
}

export default App;