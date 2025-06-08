import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import { usePopup } from '../../context/PopupContext';
import { getEventsForDate } from '../../utils/eventUtils';
import { UpcomingEvent } from '../UpcomingEventsWidget';

const DayDetailsPopup: React.FC = () => {
  const { popupData } = usePopup();
  const data = popupData.dayDetails || { date: '', dayData: { date: '', completedTasks: 0, totalTasks: 0, completedTaskIds: [], repeatingTaskIds: [], nonRepeatingTaskIds: [], completedTaskTexts: [] }, tasks: [] };
  
  const selectedDay = data.dayData;
  const tasks = data.tasks;
  const [remarkInput, setRemarkInput] = useState(selectedDay.remark || '');
  const [isEditingRemark, setIsEditingRemark] = useState(!selectedDay.remark);
  const [dayEvents, setDayEvents] = useState<UpcomingEvent[]>([]);
  
  // Fetch events for this day
  useEffect(() => {
    if (selectedDay && selectedDay.date) {
      const events = getEventsForDate(selectedDay.date);
      setDayEvents(events);
    }
  }, [selectedDay]);
  
  // Handle saving remark
  const handleRemarkSave = () => {
    if (!selectedDay) return;
    
    // Find the index of the selected day in the dailyData array
    try {
      // Get existing data
      const dailyDataStr = localStorage.getItem('todo-tracker-daily-data');
      const dailyData = dailyDataStr ? JSON.parse(dailyDataStr) : [];
        // Find day index
      const dayIndex = dailyData.findIndex((d: { date: string }) => d.date === selectedDay.date);
      
      if (dayIndex >= 0) {
        // Create a new array with the updated day data
        const updatedDailyData = [...dailyData];
        updatedDailyData[dayIndex] = {
          ...selectedDay,
          remark: remarkInput.trim() || undefined // Remove empty strings
        };
        
        // Save to localStorage
        localStorage.setItem('todo-tracker-daily-data', JSON.stringify(updatedDailyData));
        
        // Show a brief success message or feedback
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
        successMsg.textContent = 'Remark saved successfully';
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 2000);
        
        // Update local state
        setIsEditingRemark(false);
      }
    } catch (error) {
      console.error('Error saving remark:', error);
    }
  };

  const handleEditRemark = () => {
    setIsEditingRemark(true);
  };
  
  if (!selectedDay) return null;
  
  return (
    <div className="space-y-4 sm:space-y-5 max-h-[70vh] overflow-y-auto">
      {/* Events section - show at the top */}
      {dayEvents.length > 0 && (
        <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-orange-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.5 9.09H20.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Events ({dayEvents.length})
          </p>
          <div className="mt-1 sm:mt-2 space-y-1.5 sm:space-y-2">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                className={`flex items-center gap-1.5 sm:gap-2 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl border-l-4 ${
                  event.color === 'red' ? 'border-red-500' : 
                  event.color === 'blue' ? 'border-blue-500' : 
                  event.color === 'green' ? 'border-green-500' : 
                  event.color === 'purple' ? 'border-purple-500' : 
                  'border-orange-500'
                }`}>
                <div className="flex flex-col flex-1">
                  <span className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">{event.title}</span>
                  <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                    {format(parseISO(`${event.date}T${event.time}`), 'h:mm a')}
                    {event.description && ` - ${event.description}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300">All Tasks</p>
          <p className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {selectedDay.totalTasks > 0 
              ? Math.round((selectedDay.completedTasks / selectedDay.totalTasks) * 100)
              : 0}%
          </p>
          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
            ({selectedDay.completedTasks} / {selectedDay.totalTasks})
          </p>
        </div>
        
        <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300">Non-Repeating</p>
          <p className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {selectedDay.nonRepeatingTaskIds.length > 0 
              ? Math.round((selectedDay.completedTaskIds.filter(id => 
                  selectedDay.nonRepeatingTaskIds.includes(id)).length / 
                  selectedDay.nonRepeatingTaskIds.length) * 100)
              : 0}%
          </p>
          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
            ({selectedDay.completedTaskIds.filter(id => selectedDay.nonRepeatingTaskIds.includes(id)).length} / {selectedDay.nonRepeatingTaskIds.length})
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">Completed Tasks</p>
        <div className="mt-1 sm:mt-2 space-y-1.5 sm:space-y-2">
          {selectedDay.completedTaskIds.map(taskId => {
            // First check if task exists in the current tasks list
            const task = tasks.find(t => t.id === taskId);
            
            // If task exists in current list, display it
            if (task) {
              return (
                <div key={taskId} className="flex items-center gap-1.5 sm:gap-2 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl">
                  <div className={clsx(
                    'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full',
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  )} />
                  <span className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">{task.text}</span>
                </div>
              );
            } 
            
            // If task doesn't exist in current list but exists in completedTaskTexts, display from there
            const deletedTask = selectedDay.completedTaskTexts?.find(t => t.id === taskId);
            if (deletedTask) {
              return (
                <div key={taskId} className="flex items-center gap-1.5 sm:gap-2 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl">
                  <div className={clsx(
                    'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full',
                    deletedTask.priority === 'high' ? 'bg-red-500' :
                    deletedTask.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  )} />
                  <span className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">{deletedTask.text}</span>
                </div>
              );
            }
            
            return null;
          })}
        </div>
      </div>
      
      {/* Remark section */}
      <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">Remark</p>
        {isEditingRemark || !selectedDay.remark ? (
          <>
            <textarea 
              className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-white rounded-xl text-xs sm:text-sm p-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-zinc-200 dark:border-zinc-600"
              placeholder="Add a remark for this day"
              rows={3}
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
            ></textarea>
            <div className="flex gap-2">
              <button
                onClick={handleRemarkSave}
                className="mt-2 px-4 py-2 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors"
              >
                Save Remark
              </button>
              {isEditingRemark && selectedDay.remark && (
                <button
                  onClick={() => {
                    setIsEditingRemark(false);
                    setRemarkInput(selectedDay.remark || '');
                  }}
                  className="mt-2 px-4 py-2 text-xs sm:text-sm bg-zinc-500 hover:bg-zinc-600 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <div className="flex justify-between items-center">
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200">{selectedDay.remark}</p>
              <button
                onClick={handleEditRemark}
                className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-orange-600 dark:text-orange-400 transition-colors ml-2"
                title="Edit Remark"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayDetailsPopup;
