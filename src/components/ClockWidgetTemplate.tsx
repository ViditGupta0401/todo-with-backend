import { FiClock } from 'react-icons/fi';
import { WidgetTemplate } from './WidgetSelector';

export const clockWidgetTemplate: WidgetTemplate = {
  id: 'clock',
  title: 'Clock',
  icon: <FiClock size={24} />,
  description: 'A beautiful clock with week, month, year progress',
  defaultSize: { w: 2, h: 2 }
};
