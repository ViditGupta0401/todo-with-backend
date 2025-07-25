import React from 'react';
import App from './App';
import { WidgetProvider } from './context/WidgetContext';
import { PopupProvider } from './context/PopupContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

const AppWithProviders: React.FC = () => {
  return (
    <NotificationProvider>
      <VercelAnalytics />
      <ThemeProvider>
        <UserProvider>
        <PopupProvider>
          <WidgetProvider>
            <App />
          </WidgetProvider>
        </PopupProvider>
        </UserProvider>
      </ThemeProvider>
    </NotificationProvider>
  );
};

export default AppWithProviders;