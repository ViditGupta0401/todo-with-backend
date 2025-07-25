import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppWithProviders from './AppWithProviders.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithProviders />
  </StrictMode>
);