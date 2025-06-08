import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { WidgetTemplate } from '../../types';

const PomodoroWidgetTemplate: React.FC = () => {
  const pomodoroTemplate: WidgetTemplate = {
    id: 'pomodoro',
    title: 'Pomodoro Timer',
    icon: <FontAwesomeIcon icon={faClock} />,
    description: 'Focus timer with customizable intervals',
    defaultSize: { w: 1, h: 1 }
  };

  return (
    <div className="widget-template">
      <div className="widget-template-icon">
        <FontAwesomeIcon icon={faClock} size="2x" className="text-[#ff4101]" />
      </div>
      <div className="widget-template-details">
        <h3 className="widget-template-title text-lg font-medium">
          {pomodoroTemplate.title}
        </h3>
        <p className="widget-template-description text-sm text-gray-500 dark:text-gray-400">
          {pomodoroTemplate.description}
        </p>
      </div>
    </div>
  );
};

export default PomodoroWidgetTemplate;
