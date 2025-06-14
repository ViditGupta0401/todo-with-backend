import React, { useState, useRef } from 'react';
import { 
  FiSettings, 
  FiCheck,
  FiEdit
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useWidgetContext } from '../context/WidgetContext';
import Guide from './Guide';

const Dock: React.FC = () => {
  const { isEditingLayout, setIsEditingLayout, setShowWidgetSelector } = useWidgetContext();
  const { theme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [activeIcon, setActiveIcon] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleEditLayoutToggle = () => {
    setIsEditingLayout(!isEditingLayout);
    setShowSettings(false);
  };

  const handleIconHover = (icon: string | null) => {
    setActiveIcon(icon);
    if (icon === 'settings') {
      setShowSettings(true);
    } else {
      setShowSettings(false);
    }
  };

  // Handle mouse leave specifically for the settings button
  const handleButtonMouseLeave = (e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const settingsElement = settingsRef.current;

    // If mouse leaves the button and does not enter the settings popup, hide.
    // We use a small timeout to allow for cursor movement between the button and the popup.
    setTimeout(() => {
      if (settingsElement && !settingsElement.contains(relatedTarget)) {
        setShowSettings(false);
        setActiveIcon(null);
      }
    }, 100); // Small delay to prevent flickering
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {/* Settings popup */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-end"
          onClick={() => {
            setShowSettings(false);
            setActiveIcon(null);
          }} // Click anywhere on backdrop to hide
          style={{ pointerEvents: 'auto' }} // Ensure backdrop captures clicks
        >
          <div
            ref={settingsRef}
            className="absolute bottom-16 right-6 min-w-[200px]"
            tabIndex={-1}
            onClick={e => e.stopPropagation()} // Stop propagation so backdrop's click doesn't hide
            style={{ zIndex: 101 }}
          >
            <div
              className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700 transition-all duration-300 animate-settings-fade-in"
              style={{
                animation: showSettings
                  ? 'settings-fade-in 0.28s cubic-bezier(0.4,0,0.2,1)'
                  : 'settings-fade-out 0.22s cubic-bezier(0.4,0,0.2,1)'
              }}
            >
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Settings</h3>
                
                <div className="flex items-center justify-between">
                  <button 
                    onClick={handleEditLayoutToggle}
                    className="w-full text-left py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Edit Layout
                  </button>
                  <button 
                    onClick={handleEditLayoutToggle}
                    className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                      isEditingLayout 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } hidden`}
                  >
                    {isEditingLayout ? <FiCheck size={18} /> : <FiEdit size={18} />}
                  </button>
                </div>
                
                {/* Guide Button */}
                <button
                  onClick={() => { setShowGuide(true); setShowSettings(false); }}
                  className="w-full text-left py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 mt-1"
                >
                  Guide & Documentation
                </button>

                {/* Feedback Link */}
                <a
                  href="https://forms.gle/iecFXNK53Cwf1odC9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 mt-1 block"
                >
                  Feedback & Issues
                </a>
                
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">TodoTrack</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">v1.8.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 bg-gray-100 dark:bg-zinc-800 rounded-full p-2"
              aria-label="Close Guide"
            >
              ×
            </button>
            <Guide />
          </div>
        </div>
      )}

      {/* Main dock - Magic UI style */}
      <div className="flex items-center backdrop-blur-lg bg-white/75 dark:bg-zinc-800/80 rounded-2xl shadow-xl p-1.5 border border-white/20 dark:border-zinc-700/50">      <div className="flex gap-1">
          {/* Widget+ Button */}
          <div className="flex items-center">
            <button
              onClick={() => setShowWidgetSelector(true)}
              onMouseEnter={() => handleIconHover('widget')}
              onMouseLeave={() => handleIconHover(null)}
              className="group relative flex items-center justify-center h-12 w-12 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/50 hover:scale-[1.03] transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-current">
                <path d="M20.5 16.75h-2.25V14.5c0-.41-.34-.75-.75-.75s-.75.34-.75.75v2.25H14.5c-.41 0-.75.34-.75.75s.34.75.75.75h2.25v2.25c0 .41.34.75.75.75s.75-.34.75-.75v-2.25h2.25c.41 0 .75-.34.75-.75s-.34-.75-.75-.75Z" fill="currentColor"/>
                <path opacity=".4" d="M22 8.52V3.98C22 2.57 21.36 2 19.77 2h-4.04c-1.59 0-2.23.57-2.23 1.98v4.53c0 1.42.64 1.98 2.23 1.98h4.04c1.59.01 2.23-.56 2.23-1.97Z" fill="currentColor"/>
                <path d="M10.5 8.52V3.98C10.5 2.57 9.86 2 8.27 2H4.23C2.64 2 2 2.57 2 3.98v4.53c0 1.42.64 1.98 2.23 1.98h4.04c1.59.01 2.23-.56 2.23-1.97Z" fill="currentColor"/>
                <path opacity=".4" d="M10.5 19.77v-4.04c0-1.59-.64-2.23-2.23-2.23H4.23c-1.59 0-2.23.64-2.23 2.23v4.04C2 21.36 2.64 22 4.23 22h4.04c1.59 0 2.23-.64 2.23-2.23Z" fill="currentColor"/>
              </svg>
              <span className={`absolute -top-8 text-xs font-medium px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity
                ${theme === 'dark' ? 'bg-zinc-800 text-zinc-100' : 'bg-white text-zinc-900 border border-zinc-200 shadow'}
              `}>
                Add Widget
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 self-center bg-gray-200 dark:bg-gray-700 mx-1"></div>
          
          {/* Settings Button */}
          <button 
            ref={buttonRef}
            onMouseEnter={() => handleIconHover('settings')}
            onMouseLeave={handleButtonMouseLeave}
            className={`group relative flex items-center justify-center h-12 w-12 rounded-xl transition-all duration-300 ${
              activeIcon === 'settings' || showSettings
                ? 'bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 scale-100'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/50 hover:scale-[1.03]'
            }`}
          >
            <FiSettings size={22} className={`transition-all duration-300 ${activeIcon === 'settings' ? 'scale-110' : ''}`} />
            {(activeIcon === 'settings' || showSettings) && (
              <span className={`absolute -top-8 text-xs font-medium px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity
                ${theme === 'dark' ? 'bg-zinc-800 text-zinc-100' : 'bg-white text-zinc-900 border border-zinc-200 shadow'}
              `}>
                Settings
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Edit layout floating button - shows when in edit mode */}
      {isEditingLayout && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in">
          <button 
            onClick={handleEditLayoutToggle}
            className="flex items-center justify-center gap-2 h-12 px-6 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all"
          >
            <FiCheck size={20} />
            <span className="font-medium">Done</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Dock;

/* Add to your global CSS (index.css):
@keyframes settings-fade-in {
  from { opacity: 0; transform: translateY(32px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes settings-fade-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(32px) scale(0.98); }
}
*/
