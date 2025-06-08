import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { usePopup } from '../../context/PopupContext';
import { deleteEvent } from '../../utils/eventUtils';
import type { Task } from '../../types';

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

const EventDetailsPopup: React.FC = () => {
  const { popupData, openPopup } = usePopup();
  const data = popupData.eventDetails || { date: '', events: [] };
  
  const selectedDateEvents = data.events;
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [remarkInput, setRemarkInput] = useState('');
  const [isEditingRemark, setIsEditingRemark] = useState(false);

  // Load daily data for the selected date
  useEffect(() => {
    if (data.date) {
      // Load daily data from localStorage
      try {
        const dailyDataStr = localStorage.getItem('todo-tracker-daily-data');
        if (dailyDataStr) {
          const allDailyData = JSON.parse(dailyDataStr);
          const dayData = allDailyData.find((d: DailyData) => d.date === data.date);
          if (dayData) {
            setDailyData(dayData);
            setRemarkInput(dayData.remark || '');
            setIsEditingRemark(!dayData.remark);
          } else {
            // Create empty daily data if none exists
            setDailyData({
              date: data.date,
              completedTasks: 0,
              totalTasks: 0,
              completedTaskIds: [],
              repeatingTaskIds: [],
              nonRepeatingTaskIds: [],
              completedTaskTexts: []
            });
            setIsEditingRemark(true);
          }
        } else {
          // Create empty daily data if localStorage doesn't have any data
          setDailyData({
            date: data.date,
            completedTasks: 0,
            totalTasks: 0,
            completedTaskIds: [],
            repeatingTaskIds: [],
            nonRepeatingTaskIds: [],
            completedTaskTexts: []
          });
          setIsEditingRemark(true);
        }

        // Load tasks
        const tasksStr = localStorage.getItem('todo-tracker-tasks');
        if (tasksStr) {
          setTasks(JSON.parse(tasksStr));
        }
      } catch (error) {
        console.error('Error loading daily data:', error);
      }
    }
  }, [data.date]);

  // Handle saving remark
  const handleRemarkSave = () => {
    if (!dailyData) return;
    
    try {
      const dailyDataStr = localStorage.getItem('todo-tracker-daily-data');
      const allDailyData = dailyDataStr ? JSON.parse(dailyDataStr) : [];
      
      const dayIndex = allDailyData.findIndex((d: { date: string }) => d.date === data.date);
      
      if (dayIndex >= 0) {
        // Update existing day
        const updatedDailyData = [...allDailyData];
        updatedDailyData[dayIndex] = {
          ...updatedDailyData[dayIndex],
          remark: remarkInput.trim() || undefined
        };
        localStorage.setItem('todo-tracker-daily-data', JSON.stringify(updatedDailyData));
      } else {
        // Create new day entry
        const newDayData = {
          ...dailyData,
          remark: remarkInput.trim() || undefined
        };
        localStorage.setItem('todo-tracker-daily-data', JSON.stringify([...allDailyData, newDayData]));
      }
      
      // Update local state
      setDailyData(prev => prev ? {...prev, remark: remarkInput.trim() || undefined} : null);
      setIsEditingRemark(false);
      
      // Show success notification
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
      successMsg.textContent = 'Remark saved successfully';
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        document.body.removeChild(successMsg);
      }, 2000);
    } catch (error) {
      console.error('Error saving remark:', error);
    }
  };

  const handleEditRemark = () => {
    setIsEditingRemark(true);
  };
  const handleRemoveEvent = (id: string) => {
    // Delete the event using our utility function
    deleteEvent(id);
    
    // Update local state
    const updatedSelectedDateEvents = selectedDateEvents.filter(event => event.id !== id);
    
    // If there are no more events for this day, just continue with the current popup
    // showing the daily task information
    if (updatedSelectedDateEvents.length === 0) {
      // Instead of closing, just update the events list to empty
      openPopup('eventDetails', {
        date: data.date,
        events: [],
      });
    } else {
      // Otherwise, reopen the popup with updated events
      openPopup('eventDetails', {
        date: data.date,
        events: updatedSelectedDateEvents,
      });
    }
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
    successMsg.textContent = 'Event removed successfully';
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
      document.body.removeChild(successMsg);
    }, 2000);
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-700 p-4 rounded-2xl shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-orange-500 rounded-full mr-2"></div>
            <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">
              Events ({selectedDateEvents.length})
            </p>
          </div>          <button
            onClick={() => {
              // Open the add event popup with this date
              const dayStr = data.date;
              openPopup('addEvent', {
                initialDate: dayStr,
                initialTime: '12:00'
              });
            }}
            className="p-1.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-500/30"
            title="Add Event"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        
        <div className="space-y-3">
          {selectedDateEvents.map(event => (
            <div key={event.id} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl">
              <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-medium mb-1">
                {event.title}
              </p>
              <div className="flex justify-between items-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {format(new Date(event.date + 'T' + event.time), 'hh:mm a')}
                </p>
                <button
                  onClick={() => handleRemoveEvent(event.id)}
                  className="p-1.5 text-xs sm:text-sm text-red-600 hover:text-red-700 rounded-lg"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Daily Tasks Section */}
      <div className="bg-white dark:bg-zinc-700 p-4 rounded-2xl shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full mr-2"></div>
            <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
              Tasks
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          {dailyData ? (
            <div>
              {/* Task Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300">All Tasks</p>
                  <p className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {dailyData.totalTasks > 0 
                      ? Math.round((dailyData.completedTasks / dailyData.totalTasks) * 100)
                      : 0}%
                  </p>
                  <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                    ({dailyData.completedTasks} / {dailyData.totalTasks})
                  </p>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300">Non-Repeating</p>
                  <p className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {dailyData.nonRepeatingTaskIds.length > 0 
                      ? Math.round((dailyData.completedTaskIds.filter(id => 
                          dailyData.nonRepeatingTaskIds.includes(id)).length / 
                          dailyData.nonRepeatingTaskIds.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                    ({dailyData.completedTaskIds.filter(id => dailyData.nonRepeatingTaskIds.includes(id)).length} / {dailyData.nonRepeatingTaskIds.length})
                  </p>
                </div>
              </div>

              {/* Remark Section */}
              <div className="mb-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Remark
                </p>
                <div className="flex items-center">
                  {isEditingRemark ? (
                    <input
                      type="text"
                      value={remarkInput}
                      onChange={e => setRemarkInput(e.target.value)}
                      className="flex-1 p-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      placeholder="Add a remark..."
                    />
                  ) : (
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                      {dailyData.remark}
                    </p>
                  )}
                  <button
                    onClick={isEditingRemark ? handleRemarkSave : handleEditRemark}
                    className="ml-2 p-2 text-xs sm:text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    {isEditingRemark ? 'Save' : 'Edit'}
                  </button>
                </div>
              </div>
              
              {/* Tasks List */}
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">Completed Tasks</p>
              <div className="space-y-2">
                {dailyData && dailyData.completedTaskIds && dailyData.completedTaskIds.length > 0 ? (
                  dailyData.completedTaskIds.map(taskId => {
                    // Find task in current tasks list
                    const task = tasks.find(t => t.id === taskId);
                    
                    if (task) {
                      return (
                        <div key={task.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={true}
                              readOnly
                              className="mr-2 w-4 h-4 text-blue-600 bg-zinc-100 rounded focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                            />
                            <p className="text-sm sm:text-base font-medium line-through text-zinc-400 dark:text-zinc-500">
                              {task.text}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mr-3">
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    // If task doesn't exist in tasks list, check completedTaskTexts
                    const deletedTask = dailyData.completedTaskTexts?.find(t => t.id === taskId);
                    
                    if (deletedTask) {
                      return (
                        <div key={deletedTask.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={true}
                              readOnly
                              className="mr-2 w-4 h-4 text-blue-600 bg-zinc-100 rounded focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600"
                            />
                            <p className="text-sm sm:text-base font-medium line-through text-zinc-400 dark:text-zinc-500">
                              {deletedTask.text}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {deletedTask.priority.charAt(0).toUpperCase() + deletedTask.priority.slice(1)} priority
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No completed tasks for this date.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No tasks found for this date.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPopup;
