/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
import React, { createContext, useState, ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface SnackbarContextType {
  showMessage: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

export const SnackbarContext = createContext<SnackbarContextType | null>(null);

interface SnackbarProviderProps {
  children: ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const showMessage = (msg: string, sev: 'success' | 'error' | 'warning' | 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  return (
    <SnackbarContext.Provider value={{ showMessage }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}  
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
