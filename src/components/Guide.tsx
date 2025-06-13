import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKeyboard, faLightbulb, faBook, faListCheck, faChartBar, faLink, faClock, faFire, faCalendar, faCode } from '@fortawesome/free-solid-svg-icons';
import './GuideScrollbar.css';

const Guide = () => {
  const shortcuts = [
    { key: 'Ctrl + N', description: 'Add new task' },
    { key: 'Ctrl + F', description: 'Filter tasks' },
    { key: 'Ctrl + S', description: 'Save current state' },
    { key: 'Ctrl + D', description: 'Toggle dark mode' },
    { key: 'Ctrl + L', description: 'Add quick link' },
    { key: 'Ctrl + E', description: 'Add event' },
    { key: 'Ctrl + P', description: 'Start Pomodoro timer' },
    { key: 'Ctrl + H', description: 'Show/hide heatmap' },
    { key: 'Ctrl + M', description: 'Open settings menu' },
  ];

  const widgets = [
    {
      icon: faListCheck,
      name: 'Task List',
      desc: 'Manage your daily tasks. Add, edit, complete, delete, and reorder tasks. Supports priorities and repeating tasks.'
    },
    {
      icon: faChartBar,
      name: 'Analytics',
      desc: 'View your productivity stats, streaks, and completion rates. Analyze your progress over time.'
    },
    {
      icon: faFire,
      name: 'Heatmap',
      desc: 'Visualize your daily task completion as a heatmap. Spot trends and keep your streak alive!'
    },
    {
      icon: faLink,
      name: 'Quick Links',
      desc: 'Save and access your favorite links quickly. Add, edit, and remove links as needed.'
    },
    {
      icon: faClock,
      name: 'Clock',
      desc: 'A simple clock widget to keep track of time while you work.'
    },
    {
      icon: faCalendar,
      name: 'Upcoming Events',
      desc: 'Track important events and deadlines. Add events with color coding.'
    },
    {
      icon: faCode,
      name: 'LeetCode',
      desc: 'Track your LeetCode progress and stay motivated with coding challenges.'
    },
    {
      icon: faLightbulb,
      name: 'Pomodoro Timer',
      desc: 'Boost your productivity with the Pomodoro technique. Start, pause, and reset timers.'
    },
    {
      icon: faBook,
      name: 'BMI Calculator',
      desc: 'Calculate your Body Mass Index and track your health.'
    },
  ];

  const features = [
    'Customizable dashboard with drag-and-drop widgets',
    'Persistent data storage (localStorage)',
    'Daily and repeating tasks',
    'Productivity analytics and streak tracking',
    'Quick access to links and events',
    'Dark mode and responsive design',
    'Pomodoro timer for focused work',
    'LeetCode widget for coding practice',
    'BMI calculator for health tracking',
    'Keyboard shortcuts for power users',
  ];

  return (
    <div className="bg-white dark:bg-[#222126] p-6 rounded-xl shadow-xl max-w-3xl mx-auto guide-scrollbar overflow-y-auto max-h-[80vh]">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
        <FontAwesomeIcon icon={faBook} className="text-[#ff4101]" />
        Guide & Documentation
      </h2>

      {/* Features */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white flex items-center gap-2">
          <FontAwesomeIcon icon={faLightbulb} className="text-[#ff4101]" />
          Features
        </h3>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300">
          {features.map((feature, idx) => (
            <li key={idx}>{feature}</li>
          ))}
        </ul>
      </div>

      {/* Widgets */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white flex items-center gap-2">
          <FontAwesomeIcon icon={faBook} className="text-[#ff4101]" />
          Widgets & How to Use
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {widgets.map((widget, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FontAwesomeIcon icon={widget.icon} className="text-[#ff4101] text-2xl mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white">{widget.name}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{widget.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shortcuts */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white flex items-center gap-2">
          <FontAwesomeIcon icon={faKeyboard} className="text-[#ff4101]" />
          Keyboard Shortcuts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white flex items-center gap-2">
          <FontAwesomeIcon icon={faLightbulb} className="text-[#ff4101]" />
          Getting Started
        </h3>
        <ol className="list-decimal ml-6 text-gray-700 dark:text-gray-300">
          <li>Click <b>Get Started</b> or the <b>+</b> button to add your first widget.</li>
          <li>Use the <b>settings</b> (cog) icon to access layout editing and this guide.</li>
          <li>Drag and drop widgets to customize your dashboard.</li>
          <li>Use keyboard shortcuts for faster navigation and actions.</li>
          <li>Check analytics and heatmap to track your productivity.</li>
        </ol>
      </div>
    </div>
  );
};

export default Guide; 