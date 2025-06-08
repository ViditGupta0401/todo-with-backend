// Event shared utilities

import { format, isAfter, parseISO } from 'date-fns';
import { UpcomingEvent, EVENTS_STORAGE_KEY } from '../components/UpcomingEventsWidget';

// Get all events from storage
export const getAllEvents = (): UpcomingEvent[] => {
  try {
    const savedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    return savedEvents ? JSON.parse(savedEvents) : [];
  } catch (error) {
    console.error('Error loading events from localStorage:', error);
    return [];
  }
};

// Save events to storage
export const saveEvents = (events: UpcomingEvent[]): void => {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    
    // Dispatch storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: EVENTS_STORAGE_KEY,
      newValue: JSON.stringify(events)
    }));
  } catch (error) {
    console.error('Error saving events to localStorage:', error);
  }
};

// Add new event to storage
// Note: Event colors are automatically determined in AddEventPopup.tsx
// Default color is blue, but if multiple events occur on the same day,
// they will be assigned different colors (red, purple, green, or orange)
// based on how many events already exist for that date
export const addEvent = (event: UpcomingEvent): void => {
  const events = getAllEvents();
  const updatedEvents = [...events, event];
  saveEvents(updatedEvents);
};

// Delete event from storage
export const deleteEvent = (id: string): void => {
  const events = getAllEvents();
  const updatedEvents = events.filter(event => event.id !== id);
  saveEvents(updatedEvents);
};

// Get events for a specific date
export const getEventsForDate = (dateStr: string): UpcomingEvent[] => {
  const events = getAllEvents();
  return events.filter(event => event.date === dateStr);
};

// Check if a date has any events
export const hasEvents = (dateStr: string): boolean => {
  const events = getAllEvents();
  return events.some(event => event.date === dateStr);
};

// Get all upcoming events (after current date)
export const getUpcomingEvents = (): UpcomingEvent[] => {
  const events = getAllEvents();
  const now = new Date();
  
  return events.filter(event => {
    const eventDateTime = parseISO(`${event.date}T${event.time}`);
    return isAfter(eventDateTime, now);
  });
};

// Format event display time
export const formatEventTime = (event: UpcomingEvent): string => {
  return format(parseISO(`${event.date}T${event.time}`), 'hh:mm a');
};
