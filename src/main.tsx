/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';
import ThemeProviderWrapper from './context/theme/ThemeContext';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProviderWrapper>
        <App />
      </ThemeProviderWrapper>
    </AuthProvider>
  </React.StrictMode>
);

// Disable context menu on right-click only in production
const DisableContextMenu = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };
      document.addEventListener('contextmenu', handleContextMenu);
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);
  return null;
};

// Render the context menu disabler
ReactDOM.createRoot(document.createElement('div')).render(<DisableContextMenu />);
