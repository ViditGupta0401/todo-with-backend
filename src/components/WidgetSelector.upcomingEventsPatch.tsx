import { FiCalendar } from 'react-icons/fi';

export const availableWidgets = [
  // ...existing widgets...
  {
    id: 'upcomingEvents',
    title: 'Upcoming Events',
    icon: <FiCalendar size={24} />,
    description: 'See your upcoming events, exams, and deadlines',
    defaultSize: { w: 1, h: 3 }
  }
];
