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
    <div className="mb-6">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new task (Shift + Enter for repeating task)"
          className="w-[70%] m-1 px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor()}`} />
          <span className="text-xs text-gray-400">
            Use ← → to change priority
          </span>
        </div>
      </div>
    </div>
  );
};