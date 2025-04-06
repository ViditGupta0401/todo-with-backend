import React, { useState } from 'react';
import type { Task } from '../types';

interface TaskInputProps {
  onAddTask: (text: string, priority: Task['priority'], isRepeating: boolean) => void;
}

export function TaskInput({ onAddTask }: TaskInputProps) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [isRepeating, setIsRepeating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTask(text.trim(), priority, isRepeating);
      setText('');
      setPriority('medium');
      setIsRepeating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Task['priority'])}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <label className="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            checked={isRepeating}
            onChange={(e) => setIsRepeating(e.target.checked)}
            className="w-4 h-4 rounded bg-gray-800 border-gray-700 focus:ring-blue-500"
          />
          Daily Repeat
        </label>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </div>
    </form>
  );
}