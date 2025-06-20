import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, isTomorrow, isToday, differenceInDays, parseISO, isAfter } from 'date-fns';
import { usePopup } from '../context/PopupContext';
import {motion} from 'framer-motion'

// Storage key for localStorage - shared between components
export const EVENTS_STORAGE_KEY = 'upcoming-events-data';

// Event type - shared between components
export type EventColor = 'red' | 'purple' | 'blue' | 'green' | 'orange';
export interface UpcomingEvent {
  id: string;
  title: string;
  date: string; // ISO string
  time: string; // HH:mm
  description?: string;
  color: EventColor;
}

const COLOR_MAP: Record<EventColor, string> = {
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
};

const UpcomingEventsWidget: React.FC = () => {
  const [events, setEvents] = useState<UpcomingEvent[]>(() => {
    const savedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!savedEvents) {
      const legacy = localStorage.getItem('events');
      if (legacy) {
        localStorage.setItem(EVENTS_STORAGE_KEY, legacy);
        localStorage.removeItem('events');
        return JSON.parse(legacy);
      }
    }
    return savedEvents ? JSON.parse(savedEvents) : [];
  });  const { openPopup } = usePopup();
  const [maxHeight, setMaxHeight] = useState(400); // default height
  const widgetRef = useRef<HTMLDivElement>(null);

  // Group events by date (Today, Tomorrow, or date string)
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const groups: Record<string, UpcomingEvent[]> = {};
    events
      .filter(e => isAfter(parseISO(e.date + 'T' + e.time), now))
      .sort((a, b) => {
        const aDate = parseISO(a.date + 'T' + a.time);
        const bDate = parseISO(b.date + 'T' + b.time);
        return aDate.getTime() - bDate.getTime();
      })
      .forEach(event => {
        const eventDate = parseISO(event.date + 'T' + event.time);
        let group = '';
        if (isToday(eventDate)) group = 'Today';
        else if (isTomorrow(eventDate)) group = 'Tomorrow';
        else group = format(eventDate, 'd MMMM');
        if (!groups[group]) groups[group] = [];
        groups[group].push(event);
      });
    return groups;
  }, [events]);

  // Countdown string
  function getCountdown(event: UpcomingEvent) {
    const now = new Date();
    const eventDate = parseISO(event.date + 'T' + event.time);
    const diffHours = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    const diffDays = differenceInDays(eventDate, now);
    if (diffHours < 24) {
      return `${diffHours} hr`;
    } else {
      return `${diffDays} Days`;
    }
  }
  // Delete event handler
  function handleDeleteEvent(id: string) {
    // Use the shared utility function to delete the event
    import('../utils/eventUtils')
      .then(({ deleteEvent }) => {
        deleteEvent(id);
        // Event listeners will update the UI automatically
      })
      .catch(err => {
        console.error('Error deleting event:', err);
        // Fallback to direct state manipulation if import fails
        setEvents(events.filter(event => event.id !== id));
      });
  }

  // Open add event popup with defaults
  const openAddEventModal = () => {
    // Default to today's date and a reasonable time
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    openPopup('addEvent', {
      initialDate: format(tomorrow, 'yyyy-MM-dd'),
      initialTime: '12:00'
    });
  };
  // Save events to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
    }
  }, [events]);
    // Listen for custom 'event-added' event from App.tsx or other components
  useEffect(() => {
    // Define a custom event handler for 'event-added'
    const handleEventAdded = (e: Event) => {
      const customEvent = e as CustomEvent<{event: UpcomingEvent}>;
      if (customEvent.detail && customEvent.detail.event) {
        console.log('Event added event received:', customEvent.detail.event);
        // Update local state
        setEvents(prev => {
          const newEvents = [...prev, customEvent.detail.event];
          return newEvents;
        });
      }
    };
    
    // Add event listener for custom event
    window.addEventListener('event-added', handleEventAdded);

    // Add event listener for event-updated
    const handleEventUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{event: UpcomingEvent}>;
      if (customEvent.detail && customEvent.detail.event) {
        setEvents(prev => prev.map(ev => ev.id === customEvent.detail.event.id ? customEvent.detail.event : ev));
      }
    };
    window.addEventListener('event-updated', handleEventUpdated);
    
    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('event-added', handleEventAdded);
      window.removeEventListener('event-updated', handleEventUpdated);
    };
  }, []);
  
  // Listen for storage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === EVENTS_STORAGE_KEY) {
        try {
          const updatedEvents = e.newValue ? JSON.parse(e.newValue) : [];
          setEvents(updatedEvents);
        } catch (error) {
          console.error('Error parsing updated events:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (widgetRef.current) {
      setMaxHeight(widgetRef.current.scrollHeight);
    }
  }, [events]);

  return (
    <motion.div 
      ref={widgetRef}
      className="bg-[#232228] rounded-3xl p-4 shadow-xl w-full max-w-md mx-auto text-white"
      style={{ maxHeight, transition: 'max-height 0.35s cubic-bezier(.4,1.6,.6,1), padding 0.35s cubic-bezier(.4,1.6,.6,1)', overflow: 'hidden' }}
    >
      {/* Header */}      <div className="flex items-center justify-between mb-2">
        <span className="text-md text-gray-400 font-medium tracking-wide">Upcoming Events</span>
        <button
          className="text-[#ff4101] hover:text-[#e63a00] rounded-full w-8 h-8 flex items-center justify-center focus:outline-none "
          onClick={openAddEventModal}
          title="Add Event"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"><path opacity=".4" d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81v8.37C2 19.83 4.17 22 7.81 22h8.37c3.64 0 5.81-2.17 5.81-5.81V7.81C22 4.17 19.83 2 16.19 2Z" fill="#FF8A65"></path><path d="M16 11.25h-3.25V8c0-.41-.34-.75-.75-.75s-.75.34-.75.75v3.25H8c-.41 0-.75.34-.75.75s.34.75.75.75h3.25V16c0 .41.34.75.75.75s.75-.34.75-.75v-3.25H16c.41 0 .75-.34.75-.75s-.34-.75-.75-.75Z" fill="#FF8A65"></path></svg>
        </button>
      </div>{/* Events List */}
      <div className="space-y-4 mt-2">        {Object.keys(groupedEvents).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-gray-400 mb-4">No upcoming events scheduled</div>            <button
              onClick={openAddEventModal}
              className="px-4 py-2 text-sm bg-[#2d2c33] hover:bg-[#37363d] text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path opacity=".4" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" fill="#ff4101"></path>
                <path d="M16 11.25h-3.25V8c0-.41-.34-.75-.75-.75s-.75.34-.75.75v3.25H8c-.41 0-.75.34-.75.75s.34.75.75.75h3.25V16c0 .41.34.75.75.75s.75-.34.75-.75v-3.25H16c.41 0 .75-.34.75-.75s-.34-.75-.75-.75Z" fill="#ff4101"></path>
              </svg>
              Add your first event
            </button>
          </div>
        )}
        {Object.entries(groupedEvents).map(([group, groupEvents]) => (
          <div key={group} className="">
            <div className="text-base font-medium text-white mb-2 mt-2">{group}</div>
            <div className="flex flex-col gap-3">
              {groupEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-center bg-[#18171b] rounded-xl shadow-md px-4 py-3 relative group"
                  style={{ minHeight: 64 }}
                >
                  {/* Edit button - show on hover, to the left of delete button */}
                  <button
                    onClick={() => openPopup('addEvent', {
                      initialTitle: event.title,
                      initialDate: event.date,
                      initialTime: event.time,
                      initialDescription: event.description || '',
                      initialColor: event.color,
                      eventId: event.id
                    })}
                    className="absolute top-2 right-8 text-gray-500 hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit event"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path opacity=".4" d="M15.48 3H7.52C4.07 3 2 5.06 2 8.52v7.95C2 19.94 4.07 22 7.52 22h7.95c3.46 0 5.52-2.06 5.52-5.52V8.52C21 5.06 18.93 3 15.48 3Z" fill="#ba68c8"></path><path d="M21.02 2.978c-1.79-1.8-3.54-1.84-5.38 0l-1.13 1.12c-.1.1-.13.24-.09.37.7 2.45 2.66 4.41 5.11 5.11.03.01.08.01.11.01.1 0 .2-.04.27-.11l1.11-1.12c.91-.91 1.36-1.78 1.36-2.67 0-.9-.45-1.79-1.36-2.71ZM17.86 10.42c-.27-.13-.53-.26-.77-.41-.2-.12-.4-.25-.59-.39-.16-.1-.34-.25-.52-.4-.02-.01-.08-.06-.16-.14-.31-.25-.64-.59-.95-.96-.02-.02-.08-.08-.13-.17-.1-.11-.25-.3-.38-.51-.11-.14-.24-.34-.36-.55-.15-.25-.28-.5-.4-.76-.13-.28-.23-.54-.32-.79L7.9 10.72c-.35.35-.69 1.01-.76 1.5l-.43 2.98c-.09.63.08 1.22.47 1.61.33.33.78.5 1.28.5.11 0 .22-.01.33-.02l2.97-.42c.49-.07 1.15-.4 1.5-.76l5.38-5.38c-.25-.08-.5-.19-.78-.31Z" fill="#ba68c8"></path></svg>
                  </button>
                  {/* Delete button - show on hover */}
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete event"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* Colored strip */}
                  <div className={`absolute left-0 top-2 bottom-2 w-1.5 h-[60%] mt-2 -ml-[3px] rounded-full ${COLOR_MAP[event.color]}`}></div>
                  <div className="pl-4 flex-1">
                    <div className="font-bold text-[1.1rem] leading-tight mb-1">{event.title}</div>
                    <div className="text-xs text-gray-400 mb-0.5">{format(parseISO(event.date + 'T' + event.time), 'hh:mm a')}</div>
                    <div className="text-xs text-gray-500">
                      {event.description
                        ? event.description.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                            /^https?:\/\//.test(part) ? (
                              <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block align-middle ml-1 mr-1"
                                title={part}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M14.99 17.5h1.51c3.02 0 5.5-2.47 5.5-5.5 0-3.02-2.47-5.5-5.5-5.5h-1.51M9 6.5H7.5A5.51 5.51 0 0 0 2 12c0 3.02 2.47 5.5 5.5 5.5H9M8 12h8" stroke="#ba68c8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                              </a>
                            ) : (
                              <React.Fragment key={i}>{part}</React.Fragment>
                            )
                          )
                        : 'Description'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center min-w-[60px]">
                    <span className="text-xl font-medium text-gray-300">{getCountdown(event)}</span>
                    
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}      </div>
    </motion.div>
  );
};

export default UpcomingEventsWidget;
