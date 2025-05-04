import React, { useState, useRef } from 'react';
import type { Task } from '../types';

interface TaskInputProps {
  onAddTask: (text: string, priority: Task['priority'], isRepeating: boolean) => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (text.trim()) {
        onAddTask(text.trim(), priority, e.shiftKey);
        setText('');
        setPriority('medium');
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setPriority(current => {
        const priorities: Task['priority'][] = ['low', 'medium', 'high'];
        const currentIndex = priorities.indexOf(current);
        if (e.key === 'ArrowLeft') {
          return priorities[currentIndex === 0 ? priorities.length - 1 : currentIndex - 1];
        } else {
          return priorities[currentIndex === priorities.length - 1 ? 0 : currentIndex + 1];
        }
      });
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
    }
  };

  return (
    <div className="mb-4 m-1 sm:mb-6">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task (Shift+Enter for repeating)"
          className="w-full shadow-xl sm:w-[85%] md:w-[75%] px-4 py-2 sm:px-6 sm:py-3 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white text-sm sm:text-base rounded-2xl sm:rounded-3xl focus:outline-none focus:ring-2 focus:bg-gray-50 dark:focus:bg-[#181818] focus:ring-[#ff4101] transition-colors duration-200"
        />
        <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getPriorityColor()}`} />
          <span className="hidden md:block xs:inline text-xs text-gray-500 dark:text-gray-400">
            Use ← → to change priority
          </span>
        </div>
      </div>
    </div>
  );
};