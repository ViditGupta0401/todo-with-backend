import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { WidgetProvider } from './context/WidgetContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <WidgetProvider>
        <App />
      </WidgetProvider>
    </ThemeProvider>
  </StrictMode>
);
