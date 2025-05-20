import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiGrid, FiLink, FiBarChart2, FiClock } from 'react-icons/fi';
import { useWidgetContext } from '../context/WidgetContext';

// Define a type for widget templates that can be added to the screen
export interface WidgetTemplate {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  defaultSize: {
    w: number;
    h: number;
  };
}

interface WidgetSelectorProps {
  onSelectWidget: (widget: WidgetTemplate) => void;
}

// Available widget templates
const availableWidgets: WidgetTemplate[] = [
  {
    id: 'quickLinks',
    title: 'Quick Links',
    icon: <FiLink size={24} />,
    description: 'Quick access to your favorite websites and resources',
    defaultSize: { w: 1, h: 2 }
  },
  {
    id: 'todoList',
    title: 'Task List',
    icon: <FiGrid size={24} />,
    description: 'Manage your daily tasks and to-dos',
    defaultSize: { w: 2, h: 3 }
  },
  {
    id: 'analytics',
    title: 'Analytics & Heatmap',
    icon: <FiBarChart2 size={24} />,
    description: 'View your productivity metrics, streaks, and heatmap',
    defaultSize: { w: 1, h: 3 }
  },
  {
    id: 'clock',
    title: 'Clock',
    icon: <FiClock size={24} />,
    description: 'A beautiful clock with week, month, year progress',
    defaultSize: { w: 2, h: 2 }
  }
];

const WidgetSelector: React.FC<Omit<WidgetSelectorProps, 'isOpen' | 'onClose'> & { children?: React.ReactNode }> = ({ onSelectWidget }) => {
  const { showWidgetSelector, setShowWidgetSelector, activeWidgets } = useWidgetContext();

  // Only show widgets that are not already active
  const filteredWidgets = availableWidgets.filter(w => !activeWidgets.includes(w.id));

  return (
    <AnimatePresence>
      {showWidgetSelector && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowWidgetSelector(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="relative bg-white dark:bg-[#222126] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">Add Widget</h2>
              <button 
                onClick={() => setShowWidgetSelector(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Widget Grid */}
            <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 70px)' }}>
              {filteredWidgets.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10 text-lg font-medium">
                  All widgets are already added!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWidgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-700"
                      onClick={() => {
                        onSelectWidget(widget);
                        setShowWidgetSelector(false);
                      }}
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3">
                          {widget.icon}
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{widget.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {widget.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WidgetSelector;
