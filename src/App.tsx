import React, { useState, useMemo, useEffect } from 'react';
import { TaskInput } from './components/TaskInput';
import { TaskList } from './components/TaskList';
import { Analytics } from './components/Analytics';
import { Heatmap } from './components/Heatmap';
import type { Task, Filter } from './types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

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
  totalTaskIds: string[];
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Load tasks from localStorage on initial render
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks) as StoredTask[];
        // Convert timestamp strings back to numbers
        return parsedTasks.map(task => ({
          ...task,
          timestamp: Number(task.timestamp),
          lastCompleted: task.lastCompleted ? Number(task.lastCompleted) : undefined
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
    return savedData ? JSON.parse(savedData) : [];
  });

  const [filter, setFilter] = useState<Filter>('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Save daily data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(DAILY_DATA_KEY, JSON.stringify(dailyData));
  }, [dailyData]);

  // Update daily data when tasks change
  useEffect(() => {
    const now = new Date();
    const today = new Date(now);
    if (now.getHours() < 5) {
      today.setDate(today.getDate() - 1);
    }
    const todayStr = format(today, 'yyyy-MM-dd');

    const completedTasks = tasks.filter(task => {
      const taskDate = new Date(task.completed ? task.timestamp : task.lastCompleted || 0);
      const taskDay = new Date(taskDate);
      if (taskDate.getHours() < 5) {
        taskDay.setDate(taskDay.getDate() - 1);
      }
      return format(taskDay, 'yyyy-MM-dd') === todayStr && task.completed;
    });

    setDailyData(prevData => {
      const existingDayIndex = prevData.findIndex(d => d.date === todayStr);
      if (existingDayIndex >= 0) {
        const newData = [...prevData];
        newData[existingDayIndex] = {
          date: todayStr,
          completedTasks: completedTasks.length,
          totalTasks: tasks.length,
          completedTaskIds: completedTasks.map(task => task.id),
          totalTaskIds: tasks.map(task => task.id)
        };
        return newData;
      } else {
        return [...prevData, {
          date: todayStr,
          completedTasks: completedTasks.length,
          totalTasks: tasks.length,
          completedTaskIds: completedTasks.map(task => task.id),
          totalTaskIds: tasks.map(task => task.id)
        }];
      }
    });
  }, [tasks]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check and reset repeating tasks at 5 AM
  useEffect(() => {
    const checkAndResetTasks = () => {
      const now = new Date();
      const fiveAM = new Date(now);
      fiveAM.setHours(5, 0, 0, 0);
      
      // Only reset if it's exactly 5 AM
      if (now.getHours() === 5 && now.getMinutes() === 0) {
        setTasks(prevTasks => {
          // Get all repeating tasks that were completed yesterday
          const yesterdayRepeatingTasks = prevTasks.filter(task => 
            task.isRepeating && 
            task.completed && 
            task.lastCompleted && 
            new Date(task.lastCompleted) < fiveAM
          );

          // Reset completed repeating tasks
          const resetTasks = prevTasks.map(task => {
            if (task.isRepeating && task.completed) {
              const lastCompleted = task.lastCompleted ? new Date(task.lastCompleted) : null;
              const shouldReset = !lastCompleted || lastCompleted < fiveAM;
              
              if (shouldReset) {
                return {
                  ...task,
                  completed: false,
                  lastCompleted: task.completed ? Date.now() : task.lastCompleted
                };
              }
            }
            return task;
          });

          // Add new instances of completed repeating tasks for today
          const newTasks = yesterdayRepeatingTasks.map(task => ({
            ...task,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            completed: false,
            timestamp: Date.now(),
            lastCompleted: undefined
          }));

          return [...resetTasks, ...newTasks];
        });
      }
    };

    // Check every minute
    const interval = setInterval(checkAndResetTasks, 60000);
    checkAndResetTasks(); // Initial check

    return () => clearInterval(interval);
  }, []);

  // Calculate real heatmap data
  const heatmapData = useMemo(() => {
    const today = currentTime;
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const data: { [key: string]: number } = {};
    
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayData = dailyData.find(d => d.date === dateKey);
      data[dateKey] = dayData?.completedTasks || 0;
    });
    
    return data;
  }, [dailyData, currentTime]);

  // Calculate real analytics data
  const analyticsData = useMemo(() => {
    const completedTasks = tasks.filter(task => task.completed);
    const taskDates = completedTasks.map(task => {
      const date = new Date(task.timestamp);
      // Adjust the date to consider 5 AM as the start of the day
      if (date.getHours() < 5) {
        date.setDate(date.getDate() - 1);
      }
      return date;
    });
    
    // Sort dates in ascending order
    taskDates.sort((a, b) => a.getTime() - b.getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const uniqueDays = new Set<string>();
    
    for (let i = 0; i < taskDates.length; i++) {
      const date = taskDates[i];
      const dateStr = format(date, 'yyyy-MM-dd');
      uniqueDays.add(dateStr);
      
      // Calculate streaks
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = taskDates[i - 1];
        const diffDays = Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      
      // Check if this is part of the current streak
      const today = new Date();
      if (today.getHours() < 5) {
        today.setDate(today.getDate() - 1);
      }
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        currentStreak = tempStreak;
      }
    }
    
    const totalActiveDays = uniqueDays.size;
    const completionRate = tasks.length > 0 
      ? Math.round((completedTasks.length / tasks.length) * 100) 
      : 0;
    
    return {
      currentStreak,
      longestStreak,
      totalActiveDays,
      completionRate,
    };
  }, [tasks]);

  const addTask = (text: string, priority: Task['priority'], isRepeating: boolean = false) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      priority,
      completed: false,
      timestamp: Date.now(),
      isRepeating,
      lastCompleted: undefined
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed,
          lastCompleted: !task.completed ? Date.now() : task.lastCompleted
        };
      }
      return task;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const updateTask = (id: string, text: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, text } : task
    ));
  };

  const reorderTasks = (newTasks: Task[]) => {
    // Update the order of all tasks, not just filtered ones
    setTasks(newTasks);
  };

  // Filter tasks to show only today's repeating tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    if (now.getHours() < 5) {
      today.setDate(today.getDate() - 1);
    }
    const todayStr = format(today, 'yyyy-MM-dd');

    return tasks.filter(task => {
      if (filter === 'active') {
        if (task.isRepeating) {
          const taskDate = new Date(task.timestamp);
          const taskDay = new Date(taskDate);
          if (taskDate.getHours() < 5) {
            taskDay.setDate(taskDay.getDate() - 1);
          }
          return !task.completed && format(taskDay, 'yyyy-MM-dd') === todayStr;
        }
        return !task.completed;
      }
      if (filter === 'completed') return task.completed;
      return true;
    });
  }, [tasks, filter]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-5 gap-8 h-[calc(100vh-4rem)]">
        <div className="col-span-3 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Todo Tracker</h1>
            <div className="text-lg text-gray-400">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
              <span className="ml-2 font-mono">
                {format(currentTime, 'hh:mm:ss a')}
              </span>
            </div>
          </div>
          
          <div className="flex gap-4 mb-6">
            {(['all', 'active', 'completed'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === f ? 'bg-blue-600' : 'bg-gray-800'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <TaskInput onAddTask={addTask} />
          <div className="flex-1 overflow-y-auto">
            <TaskList
              tasks={filteredTasks}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onUpdateTask={updateTask}
              onReorderTasks={reorderTasks}
            />
          </div>
        </div>

        <div className="col-span-2 w-[80%] bg-gray-800 p-6 rounded-xl">
          <h2 className="text-2xl font-bold mb-6">Analytics</h2>
          <Analytics data={analyticsData} />
          <Heatmap 
            data={heatmapData} 
            dailyData={dailyData}
            tasks={tasks}
          />
        </div>
      </div>
    </div>
  );
}

export default App;