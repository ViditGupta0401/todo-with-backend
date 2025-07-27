import { supabase } from './supabaseClient';
import { Task } from '../types';

// Utility: get current user id
export const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// --- TASKS ---
export const getLocalTasks = () => {
  try {
    return JSON.parse(localStorage.getItem('todo-tracker-tasks') || '[]');
  } catch {
    return [];
  }
};

export const setLocalTasks = (tasks: any[]) => {
  localStorage.setItem('todo-tracker-tasks', JSON.stringify(tasks));
};

export const downloadTasksFromSupabase = async (user_id: string) => {
  if (!user_id) {
    console.log('No user_id provided to downloadTasksFromSupabase');
    return [];
  }

  try {
    console.log('Fetching tasks for user:', user_id);
    
    // First try to get tasks from Supabase
    const { data: supabaseTasks, error: supabaseError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (supabaseError) {
      console.error('Error downloading tasks from Supabase:', supabaseError);
      throw supabaseError;
    }

    // If no tasks in Supabase but we have local tasks, migrate them
    if ((!supabaseTasks || supabaseTasks.length === 0)) {
      const localTasks = JSON.parse(localStorage.getItem('todo-tracker-tasks') || '[]');
      if (localTasks.length > 0) {
        console.log('Found local tasks, migrating to Supabase:', localTasks.length);
        await uploadTasksToSupabase(user_id, localTasks);
        return localTasks;
      }
    }

    // Transform tasks to match our local Task interface
    const transformedTasks = (supabaseTasks || []).map(task => {
      const transformed: Task = {
        id: task.id,
        text: task.title || '',
        completed: !!task.completed,
        timestamp: new Date(task.created_at).getTime(),
        priority: task.priority === 3 ? 'high' : task.priority === 2 ? 'medium' : 'low',
        isRepeating: task.description?.includes('REPEATING') || false,
        lastCompleted: task.updated_at ? new Date(task.updated_at).getTime() : undefined
      };

      return transformed;
    });

    // Update local storage with the downloaded tasks
    localStorage.setItem('todo-tracker-tasks', JSON.stringify(transformedTasks));
    console.log('Successfully downloaded and stored', transformedTasks.length, 'tasks');

    return transformedTasks;
  } catch (error) {
    console.error('Error in downloadTasksFromSupabase:', error);
    // On error, try to return local tasks
    try {
      const localTasks = JSON.parse(localStorage.getItem('todo-tracker-tasks') || '[]');
      if (localTasks.length > 0) {
        console.log('Using local tasks as fallback:', localTasks.length);
      }
      return localTasks;
    } catch {
      return [];
    }
  }
};

// Debounced/batched upload for tasks
import { validateEvent } from './validation';

export const uploadTasksToSupabase = async (user_id: string, tasks: any[]) => {
  if (!user_id) {
    console.log('No user_id provided to uploadTasksToSupabase');
    return;
  }

  try {
    console.log('Starting task upload for user:', user_id, 'with', tasks.length, 'tasks');

    // First try to clear existing tasks to avoid conflicts
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Error deleting existing tasks:', deleteError);
      throw deleteError;
    }

    // Transform tasks for upload
    const transformedTasks = tasks.map(task => {
      const timestamp = typeof task.timestamp === 'number' ? task.timestamp : Date.now();
      const lastCompleted = typeof task.lastCompleted === 'number' ? task.lastCompleted : null;

      return {
        id: task.id,
        user_id: user_id,
        title: task.text,
        completed: task.completed,
        description: task.isRepeating ? 'REPEATING' : '',
        due_date: new Date(timestamp).toISOString().split('T')[0],
        priority: task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1,
        created_at: new Date(timestamp).toISOString(),
        updated_at: lastCompleted ? new Date(lastCompleted).toISOString() : new Date().toISOString()
      };
    });

    // Insert all tasks at once
    if (transformedTasks.length > 0) {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert(transformedTasks);

      if (insertError) {
        console.error('Error inserting tasks:', insertError);
        throw insertError;
      }
    }

    // Update local storage after successful upload
    localStorage.setItem('todo-tracker-tasks', JSON.stringify(tasks));
    console.log('Successfully synced', transformedTasks.length, 'tasks');

  } catch (error) {
    console.error('Error in uploadTasksToSupabase:', error);
    // On error, preserve local state and notify user
    localStorage.setItem('todo-tracker-tasks', JSON.stringify(tasks));
    throw new Error('Failed to sync tasks with server. Your changes are saved locally.');
  }
};

// --- EVENTS ---
export const getLocalEvents = () => {
  try {
    return JSON.parse(localStorage.getItem('upcoming-events-data') || '[]');
  } catch {
    return [];
  }
};

export const setLocalEvents = (events: any[]) => {
  localStorage.setItem('upcoming-events-data', JSON.stringify(events));
};

// Pagination: fetch events in pages
export const downloadEventsFromSupabase = async (user_id: string, { limit = 50, offset = 0 } = {}) => {
  if (!user_id) return [];
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user_id)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);
  return data || [];
};

// Debounced/batched upload for events
export const uploadEventsToSupabase = async (user_id: string, events: any[]) => {
  if (!user_id) return;

  try {
    // Validate events before processing
    const validEvents = events.filter(event => {
      const isValid = validateEvent(event);
      if (!isValid) {
        console.warn('Invalid event data:', event);
      }
      return isValid;
    });

    // Transform valid events
    const transformedEvents = validEvents.map(event => ({
      ...event,
      user_id: user_id,
      id: event.id || Date.now().toString()
    }));

    // Use upsert to handle both inserts and updates
    const { error } = await supabase
      .from('events')
      .upsert(transformedEvents, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error uploading events:', error);
    }
  } catch (error) {
    console.error('Error in uploadEventsToSupabase:', error);
  }
};

// --- WIDGETS ---
export const getLocalActiveWidgets = () => {
  try {
    return JSON.parse(localStorage.getItem('active-widgets') || '[]');
  } catch {
    return [];
  }
};

export const setLocalActiveWidgets = (widgets: any[]) => {
  localStorage.setItem('active-widgets', JSON.stringify(widgets));
};

export const uploadWidgetsToSupabase = async (user_id: string, widgets: any[]) => {
  if (!user_id) return;
  try {
    const { error } = await supabase
      .from('widgets')
      .upsert({ 
        user_id, 
        active_widgets: widgets 
      }, { 
        onConflict: 'user_id' 
      });

    if (error) {
      console.error('Error uploading widgets:', error);
    }
  } catch (error) {
    console.error('Error in uploadWidgetsToSupabase:', error);
  }
};

export const downloadWidgetsFromSupabase = async (user_id: string) => {
  if (!user_id) return [];
  try {
    const { data, error } = await supabase
      .from('widgets')
      .select('active_widgets')
      .eq('user_id', user_id)
      .single();

    if (error) {
      console.error('Error downloading widgets:', error);
      return [];
    }

    return data?.active_widgets || [];
  } catch (error) {
    console.error('Error in downloadWidgetsFromSupabase:', error);
    return [];
  }
};

// --- THEME ---
export const getLocalTheme = () => localStorage.getItem('theme') || 'dark';
export const setLocalTheme = (theme: string) => localStorage.setItem('theme', theme);
export const uploadThemeToSupabase = async (user_id: string, theme: string) => {
  if (!user_id) return;
  try {
    const { error } = await supabase
      .from('theme')
      .upsert({ 
        user_id, 
        theme 
      }, { 
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error uploading theme:', error);
    }
  } catch (error) {
    console.error('Error in uploadThemeToSupabase:', error);
  }
};

export const downloadThemeFromSupabase = async (user_id: string) => {
  if (!user_id) return 'dark';
  try {
    const { data, error } = await supabase
      .from('theme')
      .select('theme')
      .eq('user_id', user_id)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results case

    if (error) {
      console.error('Error downloading theme:', error);
      return 'dark';
    }

    // If no theme found, create one with default value
    if (!data) {
      await uploadThemeToSupabase(user_id, 'dark');
      return 'dark';
    }

    return data.theme || 'dark';
  } catch (error) {
    console.error('Error in downloadThemeFromSupabase:', error);
    return 'dark';
  }
};

// --- QUICK LINKS ---
export const getLocalQuickLinks = () => {
  try {
    return JSON.parse(localStorage.getItem('quick-links') || '[]');
  } catch {
    return [];
  }
};
export const setLocalQuickLinks = (links: any[]) => {
  localStorage.setItem('quick-links', JSON.stringify(links));
};
export const uploadQuickLinksToSupabase = async (user_id: string, links: any[]) => {
  if (!user_id) return;
  try {
    // Transform links if needed
    const transformedLinks = links.map(link => ({
      ...link,
      user_id: user_id,
      id: link.id || Date.now().toString()
    }));

    // Use upsert to handle both inserts and updates
    const { error } = await supabase
      .from('quick_links')
      .upsert(transformedLinks, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error uploading quick links:', error);
    }
  } catch (error) {
    console.error('Error in uploadQuickLinksToSupabase:', error);
  }
};

export const downloadQuickLinksFromSupabase = async (user_id: string) => {
  if (!user_id) return [];
  try {
    const { data, error } = await supabase
      .from('quick_links')
      .select('*')
      .eq('user_id', user_id);

    if (error) {
      console.error('Error downloading quick links:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in downloadQuickLinksFromSupabase:', error);
    return [];
  }
};

// --- POMODORO SETTINGS ---
export const getLocalPomodoroSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
  } catch {
    return {};
  }
};
export const setLocalPomodoroSettings = (settings: any) => {
  localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
};
export const uploadPomodoroSettingsToSupabase = async (user_id: string, settings: any) => {
  if (!user_id) return;
  try {
    // Ensure we have default values if they're missing
    const defaultSettings = {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      alarmSound: 'bell',
      alarmVolume: 50,
      tickingSound: 'none',
      tickingVolume: 50
    };

    // Merge with defaults to ensure all required fields exist
    const mergedSettings = {
      ...defaultSettings,
      ...(settings || {}),
    };

    const { error } = await supabase
      .from('pomodoro_settings')
      .upsert({ 
        user_id, 
        settings: mergedSettings 
      }, { 
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error uploading pomodoro settings:', error);
      return;
    }

    // Update local storage to ensure consistency
    localStorage.setItem('pomodoroSettings', JSON.stringify(mergedSettings));
  } catch (error) {
    console.error('Error in uploadPomodoroSettingsToSupabase:', error);
  }
};

export const downloadPomodoroSettingsFromSupabase = async (user_id: string) => {
  if (!user_id) return {};
  try {
    const { data, error } = await supabase
      .from('pomodoro_settings')
      .select('settings')
      .eq('user_id', user_id)
      .single();

    if (error) {
      console.error('Error downloading pomodoro settings:', error);
      // If there's an error, try to use local storage as fallback
      const localSettings = localStorage.getItem('pomodoroSettings');
      return localSettings ? JSON.parse(localSettings) : {};
    }

    if (data?.settings) {
      // Store in local storage for backup
      localStorage.setItem('pomodoroSettings', JSON.stringify(data.settings));
      return data.settings;
    }

    // If no data, return default settings
    const defaultSettings = {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      alarmSound: 'bell',
      alarmVolume: 50,
      tickingSound: 'none',
      tickingVolume: 50
    };

    // Store default settings
    await uploadPomodoroSettingsToSupabase(user_id, defaultSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(defaultSettings));
    return defaultSettings;
  } catch (error) {
    console.error('Error in downloadPomodoroSettingsFromSupabase:', error);
    return {};
  }
};

// --- PROFILES ---
export const downloadProfileFromSupabase = async (user_id: string) => {
  if (!user_id) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user_id).single();
  return data || null;
};

// --- ACCOUNT MANAGEMENT ---
export const deleteUserAccount = async (user_id: string) => {
  if (!user_id) return;

  try {
    console.log('Starting account deletion process for user:', user_id);

    // Delete all user data from different tables
    const tablesToClear = [
      'tasks',
      'events',
      'widgets',
      'theme',
      'quick_links',
      'pomodoro_settings',
      'profiles'
    ];

    // Delete data from all tables in parallel
    const errors = await Promise.all(tablesToClear.map(async (table) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(table === 'profiles' ? 'id' : 'user_id', user_id);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        return error;
      }
      return null;
    }));

    // Check if any deletions failed
    const failedDeletions = errors.filter(error => error !== null);
    if (failedDeletions.length > 0) {
      throw new Error('Failed to delete some user data');
    }

    // Clear all local storage
    const keysToRemove = [
      'todo-tracker-tasks',
      'upcoming-events-data',
      'active-widgets',
      'theme',
      'quick-links',
      'pomodoroSettings'
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('Successfully deleted all user data');
    return true;
  } catch (error) {
    console.error('Error in deleteUserAccount:', error);
    throw error;
  }
};

// --- MIGRATION ---
export const migrateLocalDataToSupabase = async (user_id: string) => {
  await uploadTasksToSupabase(user_id, getLocalTasks());
  await uploadEventsToSupabase(user_id, getLocalEvents());
  await uploadWidgetsToSupabase(user_id, getLocalActiveWidgets());
  await uploadThemeToSupabase(user_id, getLocalTheme());
  await uploadQuickLinksToSupabase(user_id, getLocalQuickLinks());
  await uploadPomodoroSettingsToSupabase(user_id, getLocalPomodoroSettings());
};

export const downloadAllDataFromSupabase = async (user_id: string) => {
  const [tasks, events, widgets, theme, quickLinks, pomodoroSettings] = await Promise.all([
    downloadTasksFromSupabase(user_id),
    downloadEventsFromSupabase(user_id),
    downloadWidgetsFromSupabase(user_id),
    downloadThemeFromSupabase(user_id),
    downloadQuickLinksFromSupabase(user_id),
    downloadPomodoroSettingsFromSupabase(user_id),
  ]);
  return { tasks, events, widgets, theme, quickLinks, pomodoroSettings };
}; 