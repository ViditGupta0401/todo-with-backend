import React, { createContext, useContext, useState } from 'react';

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
  const [activeWidgets, setActiveWidgets] = useState<string[]>(['quickLinks', 'todoList', 'analytics', 'clock']);
  const [isEditingLayout, setIsEditingLayout] = useState<boolean>(false);
  const [showWidgetSelector, setShowWidgetSelector] = useState<boolean>(false);

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
