import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Trash2,
  Check,
  Edit2,
  Save,
  X,
  GripVertical,
  RefreshCw,
  ArrowDownUp,
} from "lucide-react";
import type { Task } from "../types";
import clsx from "clsx";
// @ts-expect-error: Local JS component, no type declarations found for AnimatedList
import AnimatedList from "../animation/AnimatedList/AnimatedList";

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, text: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  itemTextClassName?: string;
  secondaryTextClassName?: string;
  captionClassName?: string;
  onAddClick?: (text: string, priority: Task["priority"], isRepeating: boolean) => void;
  filter: string;
  setFilter: (f: string) => void;
  showFilterDropdown: boolean;
  setShowFilterDropdown: (show: boolean) => void;
  theme: string;
  isEmpty?: boolean;
}

function SortableTaskItem({
  task,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  editingId,
  setEditingId,
  editText,
  setEditText,
  itemTextClassName = "",
  secondaryTextClassName = "",
  captionClassName = "",
}: {
  task: Task;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, text: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editText: string;
  setEditText: (text: string) => void;
  itemTextClassName?: string;
  secondaryTextClassName?: string;
  captionClassName?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
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

  // Function to extract URL from task text
  const extractUrl = (text: string): string | null => {
    // Match URLs after a space
    const urlRegex = /\s(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]+)/i;
    const match = text.match(urlRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  };

  // Format URL to ensure it has a protocol
  const formatUrl = (url: string): string => {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  // Handle click on task text with URL
  const handleTaskClick = () => {
    const url = extractUrl(task.text);
    if (url) {
      window.open(formatUrl(url), "_blank", "noopener,noreferrer");
    }
  };

  // Check if task text contains a URL
  const hasUrl = extractUrl(task.text) !== null; // Format task text to replace URL with icon and potentially truncate
  const formattedTaskText = () => {
    // Function to truncate text showing only a few words
    const truncateText = (text: string, maxWords = 5) => {
      const words = text.trim().split(/\s+/);
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(" ");
    };

    if (!hasUrl) return truncateText(task.text);

    const url = extractUrl(task.text);
    if (!url) return truncateText(task.text);

    // Replace the URL with a link icon
    const textBeforeUrl = task.text.split(url)[0];
    return (
      <span className="flex items-center gap-1.5">
        {truncateText(textBeforeUrl.trim())}
        <span className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500 dark:text-blue-400"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </span>
      </span>
    );
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group flex items-center gap-1.5 xs:gap-2 sm:gap-3 p-2 xs:p-2.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all",
        task.completed
          ? " bg-zinc-900 text-gray-500 dark:text-gray-400"
          : "bg-white dark:bg-zinc-900/50 text-gray-800 dark:text-white",
        "hover:bg-gray-200 dark:hover:bg-gray-700",
        isDragging && "shadow-lg bg-gray-200 dark:bg-gray-700",
        hasUrl && "cursor-pointer"
      )}
      onClick={hasUrl ? handleTaskClick : undefined}
    >
      {" "}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 sm:p-1 rounded flex items-center"
        onClick={(e) => e.stopPropagation()} // Prevent task click when dragging
      >
        <GripVertical
          size={14}
          className={clsx(
            task.priority === "high"
              ? "text-red-500"
              : task.priority === "medium"
              ? "text-yellow-500"
              : "text-green-500"
          )}
        />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent task click when toggling
          onToggleTask(task.id);
        }}
        className={clsx(
          "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all",
          task.completed
            ? "bg-green-500 border-0"
            : "border-2 border-gray-400 dark:border-gray-500"
        )}
      >
        {task.completed && <Check size={12} className="text-white" />}
      </button>
      {editingId === task.id ? (
        <div
          className="flex-1 flex flex-col gap-1 sm:gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white text-xs sm:text-sm rounded px-1.5 sm:px-2 py-0.5 sm:py-1 min-w-0 w-full min-h-[60px] resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-1">
            <button
              onClick={() => saveEdit(task.id)}
              className="p-0.5 sm:p-1 text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400"
            >
              <Save
                size={14}
                className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]"
              />
            </button>
            <button
              onClick={cancelEdit}
              className="p-0.5 sm:p-1 text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400"
            >
              <X size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between gap-1 overflow-hidden group/text w-full relative">
          <div className="flex-1 min-w-0">
            <span
              className={clsx(
                "text-xs sm:text-sm md:text-base break-words w-full block",
                task.completed
                  ? "line-through text-gray-400 dark:text-gray-400"
                  : "text-gray-800 dark:text-white",
                hasUrl && "text-blue-600 dark:text-blue-400",
                "group-hover/text:whitespace-normal group-hover/text:overflow-visible group-hover/text:relative",
                itemTextClassName
              )}
              title={task.text}
              style={{
                display: 'block',
                maxHeight: '3.6em', // ~3 lines
                overflow: 'hidden',
                whiteSpace: 'normal',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
                lineClamp: 3,
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                display: '-webkit-box',
              }}
            >
              {formattedTaskText()}
            </span>
          </div>
          {task.isRepeating && (
            <div
              className="flex items-center shrink-0 ml-1 transition-all duration-300 ease-in-out group-hover:translate-x-[-32px]"
              onClick={(e) => e.stopPropagation()}
              style={{ minWidth: 24 }}
            >
              {/* Updated SVG for repeating task */}
              <span className="inline-flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path fill="#555555" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" opacity=".4"></path>
                  <path fill="#555555" d="M14.9 7.59H9.31l.41-.41c.29-.29.29-.77 0-1.06a.754.754 0 00-1.06 0L6.97 7.81c-.07.07-.12.15-.16.24-.08.18-.08.39 0 .57.04.09.09.17.16.24l1.69 1.69c.15.15.34.22.53.22s.38-.07.53-.22c.29-.29.29-.77 0-1.06l-.41-.41h5.59c.47 0 .85.38.85.85v1.77c0 .41.34.75.75.75s.75-.34.75-.75V9.93c0-1.28-1.06-2.34-2.35-2.34zM17.19 15.37a.776.776 0 00-.16-.24l-1.69-1.69a.754.754 0 00-1.06 0c-.29.29-.29.77 0 1.06l.41.41H9.1a.85.85 0 01-.85-.85v-1.77c0-.41-.34-.75-.75-.75s-.75.34-.75.75v1.77c0 1.3 1.06 2.35 2.35 2.35h5.59l-.41.41c-.29.29-.29.77 0 1.06.15.15.34.22.53.22s.38-.07.53-.22l1.69-1.69c.07-.07.12-.15.16-.24a.73.73 0 000-.58z"></path>
                </svg>
              </span>
            </div>
          )}
          {/* Delete button, only visible on hover of this task */}
          <div
            className={clsx(
              "flex gap-1 sm:gap-2 transition-all shrink-0 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:right-0 duration-300",
              task.isRepeating ? 'group-hover:right-2' : ''
            )}
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 2 }}
          >
            <button
              onClick={() => onDeleteTask(task.id)}
              className="p-0.5 sm:p-1 transition-colors"
              title="Delete Task"
            >
              {/* Provided SVG for delete button */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path opacity=".4" d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81v8.37C2 19.83 4.17 22 7.81 22h8.37c3.64 0 5.81-2.17 5.81-5.81V7.81C22 4.17 19.83 2 16.19 2Z" fill="#f47373"></path>
                <path d="m13.06 12 2.3-2.3c.29-.29.29-.77 0-1.06a.754.754 0 0 0-1.06 0l-2.3 2.3-2.3-2.3a.754.754 0 0 0-1.06 0c-.29.29-.29.77 0 1.06l2.3 2.3-2.3 2.3c-.29.29-.29.77 0 1.06.15.15.34.22.53.22s.38-.07.53-.22l2.3-2.3 2.3 2.3c.15.15.34.22.53.22s.38-.07.53-.22c.29-.29.29-.77 0-1.06l-2.3-2.3Z" fill="#f47373"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onReorderTasks,
  itemTextClassName = "",
  secondaryTextClassName = "",
  captionClassName = "",
  onAddClick,
  filter,
  setFilter,
  showFilterDropdown,
  setShowFilterDropdown,
  theme,
  isEmpty,
}: TaskListProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "desc"
  ); // Default high to low
  const [isManuallyReordered, setIsManuallyReordered] = React.useState(false); // Track if tasks were manually reordered
  const [newTaskText, setNewTaskText] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState<
    "high" | "medium" | "low"
  >("medium");

  // Priority dot color
  const getPriorityDot = () => {
    switch (newTaskPriority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-400";
      case "low":
        return "bg-green-500";
    }
  };

  // Handle input key events
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowLeft") {
      setNewTaskPriority((prev) =>
        prev === "high" ? "medium" : prev === "medium" ? "low" : "low"
      );
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setNewTaskPriority((prev) =>
        prev === "low" ? "medium" : prev === "medium" ? "high" : "high"
      );
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (newTaskText.trim()) {
        if (e.shiftKey) {
          if (onAddClick) onAddClick(newTaskText, newTaskPriority, true);
        } else {
          if (onAddClick) onAddClick(newTaskText, newTaskPriority, false);
        }
        setNewTaskText("");
      }
      e.preventDefault();
    }
  };

  // Function to sort tasks by priority
  const sortTasksByPriority = (tasksToSort: Task[]) => {
    const priorityValue = { high: 3, medium: 2, low: 1 };

    return [...tasksToSort].sort((a, b) => {
      const valueA = priorityValue[a.priority];
      const valueB = priorityValue[b.priority];

      return sortDirection === "desc"
        ? valueB - valueA // High to low
        : valueA - valueB; // Low to high
    });
  };
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection((prevDirection) =>
      prevDirection === "desc" ? "asc" : "desc"
    );
    // Reset manual reordering flag when sorting
    setIsManuallyReordered(false);
  };

  // Update editText when editingId changes
  React.useEffect(() => {
    if (editingId) {
      const task = tasks.find((t) => t.id === editingId);
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
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      const newTasks = Array.from(tasks);
      const [movedTask] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedTask);

      // Set flag to indicate manual reordering has occurred
      setIsManuallyReordered(true);

      // Pass the new order directly to the parent
      onReorderTasks(newTasks);
    }
  };

  // Dropdown options
  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
  ];
  return (
    <div
      className="p-3 bg-zinc-800  rounded-3xl shadow-2xl w-full"
      // style={{ boxShadow: "box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 50px;" }}
    >
      <div className={clsx("flex items-center mb-2 justify-between z-10 top-0")}>
        <div className="flex items-center gap-3 w-full">
          <button
            className={clsx(
              "px-6 py-2 rounded-3xl text-sm shadow-inner flex items-center gap-2 focus:outline-none border border-[#2A2A2A]",
              theme === "dark"
                ? "bg-zinc-900 text-[#ACACAD]"
                : "bg-orange-600 text-white",
              "transition-colors",
              showFilterDropdown ? "ring-2 ring-orange-700" : ""
            )}
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            {filterOptions.find((opt) => opt.value === filter)?.label || "All"}
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showFilterDropdown && (
            <div
              className={clsx(
                "absolute left-0 mt-2 w-36 rounded-xl shadow-gray-800 shadow-lg z-20 border border-[#2A2A2A] transition-all",
                theme === "dark"
                  ? "bg-[#2A2A2A] text-[#ACACAD]"
                  : "bg-white text-gray-900"
              )}
              style={{
                overflow: 'hidden',
                boxShadow: theme === 'dark' ? '0 8px 32px 0 #000a, 0 1.5px 6px 0 #0004' : '0 8px 32px 0 #0002, 0 1.5px 6px 0 #0001',
                animation: 'dropdown-fade-in 0.22s cubic-bezier(0.4,0,0.2,1)'
              }}
            >
              <div className="p-1">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={clsx(
                      "w-full text-left px-5 py-2 rounded-xl transition-colors",
                      filter === opt.value
                        ? "bg-orange-800/50 text-white shadow-lg"
                        : theme === "dark"
                        ? "hover:bg-[#0E0E0F]"
                        : "hover:bg-gray-100"
                    )}
                    onClick={() => {
                      setFilter(opt.value);
                      setShowFilterDropdown(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Styled input field with dot and + button */}
          <div className="flex items-center bg-[#18181c] rounded-3xl px-4 py-2 ml-2 flex-grow min-w-0 border border-transparent focus-within:ring-2 focus-within:ring-orange-700">
            <input
              type="text"
              className="flex-1 min-w-0 bg-transparent outline-none text-[#EDEDED] placeholder-[#ACACAD] text-base"
              placeholder="Add task here.."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              aria-label="Add new task"
              style={{ maxWidth: '100%' }}
            />
            <span className={clsx("ml-2 w-3 h-3 rounded-full", getPriorityDot())}></span>
          </div>
          
        </div>
      </div>
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#ACACAD] text-base sm:text-lg select-none py-8 min-h-[120px]">
          <span>No tasks to show.</span>
          <span className="text-xs mt-1">
            Add a new task using the + button.
          </span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {" "}
            <AnimatedList
              as="div"
              className="space-y-1"
              items={isManuallyReordered ? tasks : sortTasksByPriority(tasks)}
              itemKey={(task: Task) => task.id}
            >
              {(task: Task) => (
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
                  itemTextClassName={itemTextClassName}
                  secondaryTextClassName={secondaryTextClassName}
                  captionClassName={captionClassName}
                />
              )}
            </AnimatedList>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

/* Add to the bottom of the file or in your global CSS */
// In index.css or a relevant CSS file:
// @keyframes dropdown-fade-in {
//   from { opacity: 0; transform: translateY(-8px) scale(0.98); }
//   to { opacity: 1; transform: translateY(0) scale(1); }
// }
