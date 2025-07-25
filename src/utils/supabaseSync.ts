import { supabase } from './supabaseClient';

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

// Pagination: fetch tasks in pages
export const downloadTasksFromSupabase = async (user_id: string, { limit = 50, offset = 0 } = {}) => {
  if (!user_id) return [];
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user_id)
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);
  return data || [];
};

// Debounced/batched upload for tasks
let taskUploadTimeout: NodeJS.Timeout | null = null;
let pendingTaskUpload: { user_id: string; tasks: any[] } | null = null;
const TASK_UPLOAD_DEBOUNCE = 400; // ms

export const uploadTasksToSupabase = (user_id: string, tasks: any[]) => {
  if (!user_id) return;
  pendingTaskUpload = { user_id, tasks };
  if (taskUploadTimeout) clearTimeout(taskUploadTimeout);
  taskUploadTimeout = setTimeout(async () => {
    if (!pendingTaskUpload) return;
    await supabase.from('tasks').delete().eq('user_id', pendingTaskUpload.user_id);
    if (pendingTaskUpload.tasks.length > 0) {
      await supabase.from('tasks').insert(pendingTaskUpload.tasks.map(t => ({ ...t, user_id: pendingTaskUpload!.user_id })));
    }
    pendingTaskUpload = null;
  }, TASK_UPLOAD_DEBOUNCE);
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
let eventUploadTimeout: NodeJS.Timeout | null = null;
let pendingEventUpload: { user_id: string; events: any[] } | null = null;
const EVENT_UPLOAD_DEBOUNCE = 400; // ms

export const uploadEventsToSupabase = (user_id: string, events: any[]) => {
  if (!user_id) return;
  pendingEventUpload = { user_id, events };
  if (eventUploadTimeout) clearTimeout(eventUploadTimeout);
  eventUploadTimeout = setTimeout(async () => {
    if (!pendingEventUpload) return;
    await supabase.from('events').delete().eq('user_id', pendingEventUpload.user_id);
    if (pendingEventUpload.events.length > 0) {
      await supabase.from('events').insert(pendingEventUpload.events.map(e => ({ ...e, user_id: pendingEventUpload!.user_id })));
    }
    pendingEventUpload = null;
  }, EVENT_UPLOAD_DEBOUNCE);
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
  await supabase.from('widgets').upsert([{ user_id, active_widgets: widgets }], { onConflict: ['user_id'] });
};

export const downloadWidgetsFromSupabase = async (user_id: string) => {
  if (!user_id) return [];
  const { data } = await supabase.from('widgets').select('active_widgets').eq('user_id', user_id).single();
  return data?.active_widgets || [];
};

// --- THEME ---
export const getLocalTheme = () => localStorage.getItem('theme') || 'dark';
export const setLocalTheme = (theme: string) => localStorage.setItem('theme', theme);
export const uploadThemeToSupabase = async (user_id: string, theme: string) => {
  if (!user_id) return;
  await supabase.from('theme').upsert([{ user_id, theme }], { onConflict: ['user_id'] });
};
export const downloadThemeFromSupabase = async (user_id: string) => {
  if (!user_id) return 'dark';
  const { data } = await supabase.from('theme').select('theme').eq('user_id', user_id).single();
  return data?.theme || 'dark';
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
  await supabase.from('quick_links').delete().eq('user_id', user_id);
  if (links.length > 0) {
    await supabase.from('quick_links').insert(links.map(l => ({ ...l, user_id })));
  }
};
export const downloadQuickLinksFromSupabase = async (user_id: string) => {
  if (!user_id) return [];
  const { data } = await supabase.from('quick_links').select('*').eq('user_id', user_id);
  return data || [];
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
  await supabase.from('pomodoro_settings').upsert([{ user_id, settings }], { onConflict: ['user_id'] });
};
export const downloadPomodoroSettingsFromSupabase = async (user_id: string) => {
  if (!user_id) return {};
  const { data } = await supabase.from('pomodoro_settings').select('settings').eq('user_id', user_id).single();
  return data?.settings || {};
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