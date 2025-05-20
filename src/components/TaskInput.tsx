import React, { useState } from 'react';
import type { Task } from '../types';

interface TaskInputProps {
  onAddTask: (text: string, priority: Task['priority'], isRepeating: boolean) => void;
  inputClassName?: string;
  showModal?: boolean;
  setShowModal?: (show: boolean) => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, inputClassName = '', showModal, setShowModal }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [isRepeating, setIsRepeating] = useState(false);

  const handleAddTask = () => {
    if (text.trim()) {
      onAddTask(text.trim(), priority, isRepeating);
      setText('');
      setPriority('medium');
      setIsRepeating(false);
      if (setShowModal) setShowModal(false);
    }
  };

  const handleCancel = () => {
    setText('');
    setPriority('medium');
    setIsRepeating(false);
    if (setShowModal) setShowModal(false);
  };

  const getPriorityColor = (selectedPriority: Task['priority']) => {
    switch (selectedPriority) {
      case 'high':
        return 'bg-red-500 border-red-500';
      case 'medium':
        return 'bg-yellow-500 border-yellow-500';
      case 'low':
        return 'bg-green-500 border-green-500';
    }
  };
  return (
    <div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-5 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Add New Task</h3>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What needs to be done?"
              className={`w-full px-4 py-2 mb-4 bg-white dark:bg-zinc-700 text-gray-800 dark:text-white rounded-lg border border-gray-300 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#ff4101] min-h-[100px] resize-y ${inputClassName}`}
              autoFocus
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Priority</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as Task['priority'][]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1.5 rounded-lg border-2 ${priority === p 
                      ? getPriorityColor(p) + ' text-white' 
                      : 'bg-transparent border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300'
                    } capitalize flex-1`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-5">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isRepeating}
                  onChange={() => setIsRepeating(!isRepeating)}
                  className="w-4 h-4 text-[#ff4101] rounded focus:ring-[#ff4101]"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Repeating task</span>
              </label>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="px-4 py-2 rounded-lg bg-[#ff4101] text-white hover:bg-[#e43b01]"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};