import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { uploadWidgetsToSupabase } from '../utils/supabaseSync';

interface WidgetContextType {
  activeWidgets: string[];
  setActiveWidgets: React.Dispatch<React.SetStateAction<string[]>>;
  isEditingLayout: boolean;
  setIsEditingLayout: React.Dispatch<React.SetStateAction<boolean>>;
  showWidgetSelector: boolean;
  setShowWidgetSelector: React.Dispatch<React.SetStateAction<boolean>>;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const WidgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load active widgets from localStorage or use defaults
  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
    try {
      const savedWidgets = localStorage.getItem('active-widgets');
      if (savedWidgets) {
        const parsed = JSON.parse(savedWidgets);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading active widgets from localStorage:', error);
    }
    // Return empty array if no widgets in localStorage
    return [];
  });
  
  const [isEditingLayout, setIsEditingLayout] = useState<boolean>(false);
  const [showWidgetSelector, setShowWidgetSelector] = useState<boolean>(false);
  const { user, isGuest } = useUser();
  // Save active widgets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('active-widgets', JSON.stringify(activeWidgets));
      if (user && !isGuest) uploadWidgetsToSupabase(user.id, activeWidgets);
    } catch (error) {
      console.error('Error saving active widgets to localStorage:', error);
    }
  }, [activeWidgets, user, isGuest]);
  
  return (
    <WidgetContext.Provider value={{
      activeWidgets,
      setActiveWidgets,
      isEditingLayout,
      setIsEditingLayout,
      showWidgetSelector,
      setShowWidgetSelector
    }}>
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidgetContext = () => {
  const context = useContext(WidgetContext);
  if (!context) throw new Error('useWidgetContext must be used within a WidgetProvider');
  return context;
};
