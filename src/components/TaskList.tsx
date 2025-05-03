import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Check, Edit2, Save, X, GripVertical, RefreshCw } from 'lucide-react';
import type { Task } from '../types';
import clsx from 'clsx';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, text: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
}

function SortableTaskItem({ task, onToggleTask, onDeleteTask, onUpdateTask, editingId, setEditingId, editText, setEditText }: 
  { 
    task: Task;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onUpdateTask: (id: string, text: string) => void;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    editText: string;
    setEditText: (text: string) => void;
  }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const saveEdit = (id: string) => {
    onUpdateTask(id, editText);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'group flex items-center gap-1.5 xs:gap-2 sm:gap-3 p-2 xs:p-2.5 sm:p-3 rounded-lg sm:rounded-xl md:rounded-2xl transition-all',
        task.completed ? 
          'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400' : 
          'bg-white dark:bg-zinc-800/50 text-gray-800 dark:text-white',
        'hover:bg-gray-200 dark:hover:bg-gray-700',
        isDragging && 'shadow-lg bg-gray-200 dark:bg-gray-700'
      )}
    >
      <div 
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 sm:p-1 rounded flex items-center"
      >
        <GripVertical size={14} className="text-gray-400" />
      </div>

      <button
        onClick={() => onToggleTask(task.id)}
        className={clsx(
          'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all',
          task.completed ? 'bg-green-500' : 'border-2 border-gray-400 dark:border-gray-500'
        )}
      >
        {task.completed && <Check size={12} className="text-white" />}
      </button>

      {editingId === task.id ? (
        <div className="flex-1 flex gap-1 sm:gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white text-xs sm:text-sm rounded px-1.5 sm:px-2 py-0.5 sm:py-1"
            autoFocus
          />
          <button
            onClick={() => saveEdit(task.id)}
            className="p-0.5 sm:p-1 text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400"
          >
            <Save size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
          </button>
          <button
            onClick={cancelEdit}
            className="p-0.5 sm:p-1 text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400"
          >
            <X size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-1 sm:gap-2">
          <span
            className={clsx(
              'text-xs sm:text-sm md:text-base line-clamp-2',
              task.completed ? 'line-through text-gray-400 dark:text-gray-400' : 'text-gray-800 dark:text-white'
            )}
          >
            {task.text}
          </span>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {task.isRepeating && (
              <RefreshCw size={12} className="text-blue-600 dark:text-blue-400" />
            )}
            <span className={clsx(
              'text-[8px] xs:text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full whitespace-nowrap',
              task.priority === 'high' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
              task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
              'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
            )}>
              {task.priority}
            </span>
          </div>
        </div>
      )}

      <div className={clsx(
        'flex gap-1 sm:gap-2 transition-opacity shrink-0',
        'opacity-0 group-hover:opacity-100'
      )}>
        {editingId !== task.id && (
          <button
            onClick={() => setEditingId(task.id)}
            className="p-0.5 sm:p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <Edit2 size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
          </button>
        )}
        <button
          onClick={() => onDeleteTask(task.id)}
          className="p-0.5 sm:p-1 text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400"
        >
          <Trash2 size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
        </button>
      </div>
    </div>
  );
}

export function TaskList({ tasks, onToggleTask, onDeleteTask, onUpdateTask, onReorderTasks }: TaskListProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState('');

  // Update editText when editingId changes
  React.useEffect(() => {
    if (editingId) {
      const task = tasks.find(t => t.id === editingId);
      if (task) {
        setEditText(task.text);
      }
    }
  }, [editingId, tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id);
      const newIndex = tasks.findIndex(task => task.id === over.id);
      
      const newTasks = Array.from(tasks);
      const [movedTask] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedTask);
      
      // Pass the new order directly to the parent
      onReorderTasks(newTasks);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
              onUpdateTask={onUpdateTask}
              editingId={editingId}
              setEditingId={setEditingId}
              editText={editText}
              setEditText={setEditText}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}