/**
 * Utility functions for migrating localStorage data and ensuring validity
 */

// Default widget layouts to use when creating or resetting
export const DEFAULT_WIDGET_LAYOUTS = {
  lg: [
    { i: 'quickLinks', x: 0, y: 0, w: 1, h: 2 },
    { i: 'todoList', x: 1, y: 0, w: 2, h: 3 },
    { i: 'analytics', x: 3, y: 0, w: 1, h: 2 },
    { i: 'clock', x: 0, y: 1, w: 1, h: 1 }
  ]
};

/**
 * Ensures that widget layouts are valid, resetting to defaults if necessary
 */
export function ensureValidWidgetLayouts() {
  const key = 'widget-layouts';
  try {
    const layouts = JSON.parse(localStorage.getItem(key) || '{}');
    
    // Check if layouts.lg exists and is a valid array with items
    if (!layouts.lg || !Array.isArray(layouts.lg) || layouts.lg.length === 0) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_WIDGET_LAYOUTS));
      return false; // Return false to indicate a reset happened
    }
    
    // Check if all items in lg have required properties
    const hasValidItems = layouts.lg.every((item: any) => 
      item && 
      typeof item === 'object' && 
      typeof item.i === 'string' && 
      typeof item.x === 'number' && 
      typeof item.y === 'number' && 
      typeof item.w === 'number'
    );
    
    if (!hasValidItems) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_WIDGET_LAYOUTS));
      return false; // Return false to indicate a reset happened
    }
    
    return true; // Return true to indicate layouts are valid
  } catch (error) {
    // Reset to defaults if there was an error
    localStorage.setItem(key, JSON.stringify(DEFAULT_WIDGET_LAYOUTS));
    return false;
  }
}

/**
 * Migrates widget layouts from old formats to the new format
 */
export function migrateWidgetLayouts() {
  const key = 'widget-layouts';
  const layouts = localStorage.getItem(key);
  
  // If no layouts exist, set defaults and return
  if (!layouts) {
    localStorage.setItem(key, JSON.stringify(DEFAULT_WIDGET_LAYOUTS));
    return;
  }
  
  try {
    const parsed = JSON.parse(layouts);
    
    // Handle cases where parsed is null or not an object
    if (!parsed || typeof parsed !== 'object') {
      localStorage.setItem(key, JSON.stringify(DEFAULT_WIDGET_LAYOUTS));
      return;
    }
    
    // If it's an array or not an object with breakpoints, migrate to new format
    if (Array.isArray(parsed) || !parsed.lg) {
      // Wrap in { lg: ... } format if it's an array, or create empty array if not
      const migrated = { 
        lg: Array.isArray(parsed) ? parsed : [] 
      };
      localStorage.setItem(key, JSON.stringify(migrated));
      return;
    }
    
    // If lg exists but is not an array or is empty, fix it
    if (!Array.isArray(parsed.lg) || parsed.lg.length === 0) {
      parsed.lg = DEFAULT_WIDGET_LAYOUTS.lg;
      localStorage.setItem(key, JSON.stringify(parsed));
      return;
    }
    
    // Check if all lg items have required properties
    const hasInvalidItems = parsed.lg.some((item: any) => 
      !item || 
      typeof item !== 'object' || 
      typeof item.i !== 'string' || 
      typeof item.x !== 'number' || 
      typeof item.y !== 'number' || 
      typeof item.w !== 'number'
    );
    
    if (hasInvalidItems) {
      parsed.lg = DEFAULT_WIDGET_LAYOUTS.lg;
      localStorage.setItem(key, JSON.stringify(parsed));
    }
  } catch (error) {
    // If parsing fails, reset to defaults
    localStorage.setItem(key, JSON.stringify(DEFAULT_WIDGET_LAYOUTS));
  }
}

/**
 * Ensures tasks are in valid format, fixing if needed
 */
export function migrateTasks(storageKey: string) {
  const tasks = localStorage.getItem(storageKey);
  
  if (!tasks) return; // No tasks to migrate
  
  try {
    const parsed = JSON.parse(tasks);
    
    // If not an array, reset to empty array
    if (!Array.isArray(parsed)) {
      localStorage.setItem(storageKey, JSON.stringify([]));
      return;
    }
    
    // Filter out invalid tasks and ensure all required fields
    const validTasks = parsed.filter((task: any) => 
      task && 
      typeof task === 'object' && 
      typeof task.id === 'string' && 
      typeof task.text === 'string'
    ).map((task: any) => ({
      id: task.id,
      text: task.text,
      completed: !!task.completed,
      timestamp: typeof task.timestamp === 'number' ? task.timestamp : Date.now(),
      priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium',
      isRepeating: !!task.isRepeating,
      lastCompleted: typeof task.lastCompleted === 'number' ? task.lastCompleted : undefined
    }));
    
    localStorage.setItem(storageKey, JSON.stringify(validTasks));
  } catch (error) {
    // If parsing fails, reset to empty array
    localStorage.setItem(storageKey, JSON.stringify([]));
  }
}
