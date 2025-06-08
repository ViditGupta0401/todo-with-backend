# Event System Documentation

## Overview

The event management system in TodoTrack allows users to add, view, and delete events from either the UpcomingEventsWidget or Heatmap components. Events synchronize automatically between these components through a shared storage mechanism.

## Architecture

The event system uses:

1. **Shared Data Types**: Common types and constants defined in `UpcomingEventsWidget.tsx` and used throughout the application.
2. **Centralized Event Utilities**: Helper functions in `eventUtils.ts` that provide a single source of truth for event operations.
3. **Event Synchronization**: Using browser's Storage events to communicate changes between components.

## Data Structure

Events follow this structure:

```typescript
interface UpcomingEvent {
  id: string;           // Unique identifier
  title: string;        // Event title
  date: string;         // ISO format date (YYYY-MM-DD)
  time: string;         // 24-hour format time (HH:MM)
  description?: string; // Optional description
  color: EventColor;    // Color theme (automatically determined)
}
```

Color is automatically determined:
- Default color is blue for events that are the only event on a given date
- If multiple events occur on the same day, they are assigned different colors (red, purple, green, orange) to distinguish them
- Colors cycle through the options based on the number of existing events for that date

## Utilities

The `eventUtils.ts` module provides these functions:

| Function | Description |
|----------|-------------|
| `getAllEvents()` | Retrieves all events from localStorage |
| `saveEvents(events)` | Saves events to localStorage and notifies listeners |
| `addEvent(event)` | Adds a new event and triggers synchronization |
| `deleteEvent(id)` | Removes an event and triggers synchronization |
| `getEventsForDate(dateStr)` | Retrieves events for a specific date |
| `hasEvents(dateStr)` | Checks if any events exist for a given date |
| `getUpcomingEvents()` | Gets all future events relative to current time |
| `formatEventTime(event)` | Returns a formatted time string for display |

## Component Integration

### 1. UpcomingEventsWidget

- Displays upcoming events in a list view grouped by date
- Initializes events from localStorage
- Responds to storage events to update when events are modified elsewhere

### 2. Heatmap

- Displays events as indicators on calendar days
- Allows adding events by clicking on future dates
- Shows event details in a popup when clicking on days with events
- Updates automatically when events are added/removed from other components

### 3. AddEventPopup

- Shared form for adding events from any component
- Integrated with the PopupContext system
- Supports pre-filling initial date and time

## Synchronization Mechanism

Events synchronize through:

1. **Central Storage**: All events are stored in localStorage under the key defined by `EVENTS_STORAGE_KEY`
2. **StorageEvent Listeners**: Both components have `useEffect` hooks that listen for storage events
3. **Event Dispatching**: When events are modified, a synthetic StorageEvent is dispatched to notify other components

## Usage Examples

### Adding an event from any component

```typescript
import { addEvent } from '../utils/eventUtils';

// Create event object
const newEvent = {
  id: Date.now().toString(),
  title: 'Meeting',
  date: '2023-12-31',
  time: '14:00',
  description: 'Team status update',
  color: 'blue'
};

// Add the event (will update all components)
addEvent(newEvent);
```

### Removing an event

```typescript
import { deleteEvent } from '../utils/eventUtils';

// Delete by ID (will update all components)
deleteEvent('event-123');
```

### Getting events for calendar display

```typescript
import { getEventsForDate, hasEvents } from '../utils/eventUtils';

// Check if a date has events (for highlighting calendar days)
const hasEventsForDay = hasEvents('2023-12-25');

// Get all events for a specific date
const christmasEvents = getEventsForDate('2023-12-25');
```

## Best Practices

1. Always use the utility functions from `eventUtils.ts` instead of direct localStorage access
2. Avoid creating separate event storage mechanisms
3. When adding new event-related features, extend the shared types and utilities
4. For performance, consider memoizing event lists with `useMemo` for frequently accessed event lists
