import React from 'react';
import App from './App';
import { WidgetProvider } from './context/WidgetContext';
import { PopupProvider } from './context/PopupContext';
import { ThemeProvider } from './context/ThemeContext';

const AppWithProviders: React.FC = () => {
  return (
    <ThemeProvider>
      <PopupProvider>
        <WidgetProvider>
          <App />
        </WidgetProvider>
      </PopupProvider>
    </ThemeProvider>
  );
};

export default AppWithProviders;