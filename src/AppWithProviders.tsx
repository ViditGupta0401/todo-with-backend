import React from 'react';
import App from './App';
import { WidgetProvider } from './context/WidgetContext';
import { PopupProvider } from './context/PopupContext';
import { ThemeProvider } from './context/ThemeContext';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

const AppWithProviders: React.FC = () => {
  return (
    <>
      <VercelAnalytics />
      <ThemeProvider>
        <PopupProvider>
          <WidgetProvider>
            <App />
          </WidgetProvider>
        </PopupProvider>
      </ThemeProvider>
    </>
  );
};

export default AppWithProviders;