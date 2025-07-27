// Keyboard navigation constants
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_FILTER: ['alt', 'f'],
  ADD_TASK: ['alt', 'n'],
  TOGGLE_BLUR: ['`'],
  SORT_TASKS: ['alt', 's'],
} as const;

// ARIA labels and descriptions
export const ARIA_LABELS = {
  taskList: 'Task List',
  addTask: 'Add a new task',
  taskItem: 'Task item',
  taskComplete: 'Mark task as complete',
  taskDelete: 'Delete task',
  taskEdit: 'Edit task',
  filterDropdown: 'Filter tasks',
  widgetSelector: 'Widget selector',
  settingsMenu: 'Settings menu',
} as const;

// Focus management
export const focusNextElement = (currentElement: HTMLElement | null) => {
  if (!currentElement) return;

  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = document.querySelectorAll(focusableElements);
  const currentIndex = Array.from(elements).indexOf(currentElement);
  
  if (currentIndex > -1 && currentIndex < elements.length - 1) {
    (elements[currentIndex + 1] as HTMLElement).focus();
  }
};

export const focusPreviousElement = (currentElement: HTMLElement | null) => {
  if (!currentElement) return;

  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = document.querySelectorAll(focusableElements);
  const currentIndex = Array.from(elements).indexOf(currentElement);
  
  if (currentIndex > 0) {
    (elements[currentIndex - 1] as HTMLElement).focus();
  }
};
