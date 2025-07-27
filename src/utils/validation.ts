// Validation types
interface TaskValidation {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  isRepeating?: boolean;
  lastCompleted?: number;
}

interface EventValidation {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
  color?: string;
}

interface QuickLinkValidation {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

// Validation functions
export const validateTask = (task: any): task is TaskValidation => {
  return (
    typeof task === 'object' &&
    typeof task.id === 'string' &&
    typeof task.text === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.timestamp === 'number' &&
    ['high', 'medium', 'low'].includes(task.priority) &&
    (task.lastCompleted === undefined || typeof task.lastCompleted === 'number') &&
    (task.isRepeating === undefined || typeof task.isRepeating === 'boolean')
  );
};

export const validateEvent = (event: any): event is EventValidation => {
  return (
    typeof event === 'object' &&
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.date === 'string' &&
    typeof event.time === 'string' &&
    (event.description === undefined || typeof event.description === 'string') &&
    (event.color === undefined || typeof event.color === 'string')
  );
};

export const validateQuickLink = (link: any): link is QuickLinkValidation => {
  return (
    typeof link === 'object' &&
    typeof link.id === 'string' &&
    typeof link.title === 'string' &&
    typeof link.url === 'string' &&
    (link.icon === undefined || typeof link.icon === 'string')
  );
};

export const validateSettings = (settings: any): boolean => {
  return (
    typeof settings === 'object' &&
    settings !== null &&
    !Array.isArray(settings)
  );
};
