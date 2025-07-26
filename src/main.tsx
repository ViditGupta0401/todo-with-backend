import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppWithProviders from './AppWithProviders.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppWithProviders />
    </BrowserRouter>
  </StrictMode>
);