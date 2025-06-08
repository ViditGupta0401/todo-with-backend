import { addEvent, deleteEvent, getAllEvents, getEventsForDate } from '../utils/eventUtils';
import { EVENTS_STORAGE_KEY, UpcomingEvent } from '../components/UpcomingEventsWidget';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Replace the global localStorage object with our mock
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock StorageEvent
class StorageEventMock extends Event {
  key: string;
  oldValue: string | null;
  newValue: string | null;
  storageArea: Storage | null;
  url: string;

  constructor(type: string, eventInitDict: any) {
    super(type);
    this.key = eventInitDict.key || '';
    this.oldValue = eventInitDict.oldValue || null;
    this.newValue = eventInitDict.newValue || null;
    this.storageArea = eventInitDict.storageArea || null;
    this.url = eventInitDict.url || '';
  }
}

// Mock window.dispatchEvent
const originalDispatchEvent = window.dispatchEvent;
const dispatchEventMock = jest.fn();
window.dispatchEvent = dispatchEventMock;

describe('Event Synchronization', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    dispatchEventMock.mockClear();
  });

  afterAll(() => {
    // Restore original window.dispatchEvent
    window.dispatchEvent = originalDispatchEvent;
  });

  test('addEvent saves to localStorage and dispatches storage event', () => {
    // Create a test event
    const testEvent: UpcomingEvent = {
      id: '1',
      title: 'Test Event',
      date: '2023-12-31',
      time: '12:00',
      color: 'blue'
    };

    // Add event
    addEvent(testEvent);

    // Check localStorage
    const savedEvents = JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY) || '[]');
    expect(savedEvents).toHaveLength(1);
    expect(savedEvents[0]).toEqual(testEvent);

    // Check if dispatchEvent was called with a StorageEvent
    expect(dispatchEventMock).toHaveBeenCalled();
    const calledWith = dispatchEventMock.mock.calls[0][0];
    expect(calledWith.type).toBe('storage');
    expect(calledWith.key).toBe(EVENTS_STORAGE_KEY);
  });

  test('deleteEvent removes event and dispatches storage event', () => {
    // Set up initial events
    const events = [
      {
        id: '1',
        title: 'Test Event 1',
        date: '2023-12-31',
        time: '12:00',
        color: 'blue'
      },
      {
        id: '2',
        title: 'Test Event 2',
        date: '2024-01-01',
        time: '14:00',
        color: 'red'
      }
    ];
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));

    // Delete event
    deleteEvent('1');

    // Check localStorage
    const savedEvents = JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY) || '[]');
    expect(savedEvents).toHaveLength(1);
    expect(savedEvents[0].id).toBe('2');

    // Check if dispatchEvent was called
    expect(dispatchEventMock).toHaveBeenCalled();
  });

  test('getEventsForDate returns events for a specific date', () => {
    // Set up initial events
    const events = [
      {
        id: '1',
        title: 'Test Event 1',
        date: '2023-12-31',
        time: '12:00',
        color: 'blue'
      },
      {
        id: '2',
        title: 'Test Event 2',
        date: '2023-12-31',
        time: '14:00',
        color: 'red'
      },
      {
        id: '3',
        title: 'Test Event 3',
        date: '2024-01-01',
        time: '10:00',
        color: 'green'
      }
    ];
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));

    // Get events for a specific date
    const eventsForDate = getEventsForDate('2023-12-31');
    expect(eventsForDate).toHaveLength(2);
    expect(eventsForDate[0].id).toBe('1');
    expect(eventsForDate[1].id).toBe('2');
  });
});
