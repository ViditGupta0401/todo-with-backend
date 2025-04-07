import React, { useState } from 'react';
import type { Task } from '../types';

interface TaskInputProps {
  onAddTask: (text: string, priority: Task['priority'], isRepeating: boolean) => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (text.trim()) {
        // Check if Shift is pressed
        const isRepeating = e.shiftKey;
        onAddTask(text.trim(), priority, isRepeating);
        setText('');
      }
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleSubmit}
        placeholder="Add a new task (Shift + Enter for repeating task)"
        className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Task['priority'])}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
};