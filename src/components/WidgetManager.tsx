import React, { useState, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './GridCustomStyles.css'; // Import our custom styles
import { motion, AnimatePresence } from 'framer-motion';
import { useWidgetContext } from '../context/WidgetContext';

// Width-aware responsive grid layout
const ResponsiveGridLayout = WidthProvider(Responsive);

// Define widget types for TypeScript
export interface Widget {
  i: string;
  x: number;
  y: number;
  w: number;
  h?: number; // Height is optional as it will be automatically calculated
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  content: React.ReactNode;
}

interface Layout {
  [breakpoint: string]: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    [key: string]: any;
  }>;
}

interface WidgetManagerProps {
  widgets: Widget[];
  onLayoutChange: (layouts: Layout) => void;
  onRemoveWidget?: (widgetId: string) => void;
  className?: string;
}

export const WidgetManager: React.FC<Omit<WidgetManagerProps, 'isEditingLayout' | 'onRemoveWidget'> & { onRemoveWidget?: (widgetId: string) => void }> = ({
  widgets,
  onLayoutChange,
  onRemoveWidget,
  className = '',
}) => {  const { isEditingLayout } = useWidgetContext();
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isResizing = useRef<boolean>(false);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);
  const resizeWidgetId = useRef<string | null>(null);
  
  // Layouts for different breakpoints (responsive)
  const [layouts, setLayouts] = useState<Layout>(() => {
    // Try to load layouts from localStorage
    const savedLayouts = localStorage.getItem('widget-layouts');
    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        // Ensure layouts is valid and has proper structure
        if (parsedLayouts && typeof parsedLayouts === 'object') {
          // Check if lg breakpoint exists and is a valid array
          if (!parsedLayouts.lg || !Array.isArray(parsedLayouts.lg) || parsedLayouts.lg.length === 0) {
            // Create default layouts for all widgets
            const defaultLayouts = {
              lg: widgets.map(widget => ({
                i: widget.i,
                x: widget.x,
                y: widget.y,
                w: widget.w,
                h: widget.h || 1
              }))
            };
            return defaultLayouts;
          }
          return parsedLayouts;
        }
      } catch (error) {
        console.error('Error loading widget layouts:', error);
      }
    }
    // Create default layouts if none exist
    const defaultLayouts = {
      lg: widgets.map(widget => ({
        i: widget.i,
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h || 1
      }))
    };
    return defaultLayouts;
  });// Default layout configuration
  const getLayoutItems = () => {
    return widgets.map(widget => {
      // Set initial position (x, y, w) but let height be determined by content
      return {
        ...widget,
        isDraggable: isEditingLayout,
        isResizable: false, // Disable manual resizing
        // Set a small initial height that will be automatically adjusted
        h: 1, // Minimum height
        autoHeight: true // Force auto height for all widgets
      };
    });
  };
  // Handle layout changes
  const handleLayoutChange = (currentLayout: Array<{i: string; x: number; y: number; w: number; h: number;}>, allLayouts: Layout) => {
    // Validate if allLayouts contains valid data for the lg breakpoint
    if (allLayouts && allLayouts.lg && Array.isArray(allLayouts.lg) && allLayouts.lg.length > 0) {
      setLayouts(allLayouts);
      localStorage.setItem('widget-layouts', JSON.stringify(allLayouts));
      onLayoutChange(allLayouts);
    } else {
      console.warn('Received invalid layout data, ignoring update');
    }
  };
  // When edit mode changes, update draggable state
  useEffect(() => {
    if (!isEditingLayout) {
      // Save layouts when exiting edit mode
      localStorage.setItem('widget-layouts', JSON.stringify(layouts));
    }
  }, [isEditingLayout, layouts]);
  
  // Add event listeners for resizing QuickLinks
  useEffect(() => {
    if (!isEditingLayout) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !resizeWidgetId.current) return;
        const dx = e.clientX - startX.current;
      // Calculate new width in grid columns (1 column = 25% of container width)
      const containerWidth = document.querySelector('.layout')?.clientWidth || 0;
      const colWidth = containerWidth / 4; // 4 columns in lg breakpoint
      // Limit to a maximum width of 2 columns
      const newWidth = Math.max(1, Math.min(2, startWidth.current + dx / colWidth));
      
      // Update layout with new width
      const breakpoint = Object.keys(layouts)[0] || 'lg';
      const newLayouts = { ...layouts };
      
      if (newLayouts[breakpoint]) {
        const updatedLayout = newLayouts[breakpoint].map(item => 
          item.i === resizeWidgetId.current ? { ...item, w: newWidth } : item
        );
        newLayouts[breakpoint] = updatedLayout;
        setLayouts(newLayouts);
        onLayoutChange(newLayouts);
      }
    };
    
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        resizeWidgetId.current = null;
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEditingLayout, layouts, onLayoutChange]);
  // Setup resize observers for all widgets
  useEffect(() => {
    const resizeObservers: ResizeObserver[] = [];
    const debounceTimers: Record<string, NodeJS.Timeout> = {};
    
    widgets.forEach(widget => {
      const element = contentRefs.current[widget.i];
      if (!element) return;
      
      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          // Clear existing timer for this widget if any
          if (debounceTimers[widget.i]) {
            clearTimeout(debounceTimers[widget.i]);
          }
          
          // Debounce the resize event to avoid too many updates
          debounceTimers[widget.i] = setTimeout(() => {            const height = entry.contentRect.height;
            const rowHeight = 60; // Same as in ResponsiveGridLayout
                // For exact height matching, we need to be precise
            // Get the exact fraction of rows needed
            const pixelPerfectHeight = height;
            const exactRows = pixelPerfectHeight / rowHeight;
            
            // Use the exact height in rows - this allows fractional row heights
            // which gives us pixel-perfect sizing
            const newHeightInRows = Math.max(1, exactRows);
            // Update all breakpoints
            const newLayouts = { ...layouts };
            
            // Get breakpoints to update - if no layouts yet, create for lg breakpoint
            const breakpointsToUpdate = Object.keys(layouts).length ? 
              Object.keys(layouts) : ['lg'];
            
            breakpointsToUpdate.forEach(breakpoint => {
              let currentLayout = newLayouts[breakpoint] || [];
              
              // Find widget in current layout
              const widgetIndex = currentLayout.findIndex(item => item.i === widget.i);
              
              if (widgetIndex === -1) {
                // If widget doesn't exist in this layout, add it
                const defaultWidget = { 
                  i: widget.i, 
                  x: widget.x, 
                  y: widget.y, 
                  w: widget.w, 
                  h: newHeightInRows
                };
                currentLayout = [...currentLayout, defaultWidget];
              } else if (currentLayout[widgetIndex].h !== newHeightInRows) {
                // Update height if it changed
                currentLayout = currentLayout.map(item => 
                  item.i === widget.i ? { ...item, h: newHeightInRows } : item
                );
              }
              
              newLayouts[breakpoint] = currentLayout;
            });
            
            // Only update layouts if there was a change
            const hasChanges = JSON.stringify(newLayouts) !== JSON.stringify(layouts);
            if (hasChanges) {
              setLayouts(newLayouts);
              onLayoutChange(newLayouts);
            }
          }, 50); // Shorter debounce time for more responsive resizing
        }
      });
      
      observer.observe(element);
      resizeObservers.push(observer);
    });
    
    // Cleanup observers on unmount
    return () => {
      resizeObservers.forEach(observer => observer.disconnect());
      // Clear any pending timers
      Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
    };
  }, [widgets, layouts, onLayoutChange]);
    return (
    <div className={`widget-grid-container ${className}`}>
      {/* Only render ResponsiveGridLayout if we have valid layouts */}
      {layouts && layouts.lg && Array.isArray(layouts.lg) && layouts.lg.length > 0 ? (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 }}
          rowHeight={60}
          margin={[0, 5]} // Remove margins between grid items
          containerPadding={[16, 16]}
          onLayoutChange={handleLayoutChange}
          isDraggable={isEditingLayout}
          isResizable={false} // Disable manual resizing
          useCSSTransforms={true}
          compactType="vertical"
          preventCollision={false}
          draggableHandle=".widget-drag-handle"
          autoSize={true}
          verticalCompact={true}
        >
          {getLayoutItems().map((widget) => (
            <div key={widget.i} className="relative auto-height-widget">
              <AnimatePresence>
                {isEditingLayout && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="widget-drag-handle absolute -top-3 left-1/2 transform -translate-x-1/2 z-10 cursor-grab active:cursor-grabbing"
                    >
                      <div className="bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-2 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
                          <circle cx="12" cy="9" r="1"/>
                          <circle cx="19" cy="9" r="1"/>
                          <circle cx="5" cy="9" r="1"/>
                          <circle cx="12" cy="15" r="1"/>
                          <circle cx="19" cy="15" r="1"/>
                          <circle cx="5" cy="15" r="1"/>
                        </svg>
                      </div>
                    </motion.div>
                    
                    {/* Remove widget button */}
                    {onRemoveWidget && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute -top-3 right-2 z-10 bg-white dark:bg-zinc-800 rounded-full p-1 shadow-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveWidget(widget.i);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="m13.06 12 2.3-2.3c.29-.29.29-.77 0-1.06a.754.754 0 0 0-1.06 0l-2.3 2.3-2.3-2.3a.754.754 0 0 0-1.06 0c-.29.29-.29.77 0 1.06l2.3 2.3-2.3 2.3c-.29.29-.29.77 0 1.06.15.15.34.22.53.22s.38-.07.53-.22l2.3-2.3 2.3 2.3c.15.15.34.22.53.22s.38-.07.53-.22c.29-.29.29-.77 0-1.06l-2.3-2.3Z" fill="#697689"></path></svg>
                      </motion.button>
                    )}
                  </>
                )}
              </AnimatePresence>
              <div className="w-full widget-content-wrapper p-0 m-0 relative">
                <motion.div 
                  className="w-full"
                  layout
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    duration: 0.2
                  }}
                  style={{ margin: 0, padding: 10 }}
                  ref={el => {
                    contentRefs.current[widget.i] = el;
                  }}
                >
                  {widget.content}
                </motion.div>
                {/* Show resize handle only for QuickLinks widget */}
                {widget.i === 'quickLinks' && isEditingLayout && (
                  <div 
                    className="widget-resize-handle"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      isResizing.current = true;
                      resizeWidgetId.current = widget.i;
                      startX.current = e.clientX;
                      
                      // Get current widget width from layout
                      const breakpoint = Object.keys(layouts)[0] || 'lg';
                      const currentLayout = layouts[breakpoint] || [];
                      const widgetLayout = currentLayout.find(item => item.i === widget.i);
                      startWidth.current = widgetLayout?.w || 1;
                    }}
                  >
                    <svg className=' absolute -top-10 -left-5 -rotate-180' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"><path opacity=".4" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" fill="#697689"></path><path d="m16.15 12.83-1.73.58c-.48.16-.85.53-1.01 1.01l-.58 1.73c-.49 1.49-2.59 1.46-3.05-.03L7.83 9.84c-.38-1.25.77-2.4 2-2.02l6.29 1.95c1.49.47 1.51 2.57.03 3.06Z" fill="#697689"></path></svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      ) : (
        // If we don't have valid layouts, render a fallback
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 text-center text-gray-500 dark:text-gray-400">
          Loading widgets...
        </div>
      )}
    </div>
  );
};

export default WidgetManager;