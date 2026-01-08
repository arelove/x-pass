/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

// contexts/PseudoModeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface PseudoModeContextType {
  isPseudoMode: boolean;
  checkPseudoMode: () => Promise<void>;
}

const PseudoModeContext = createContext<PseudoModeContextType>({
  isPseudoMode: false,
  checkPseudoMode: async () => {},
});

export const usePseudoModeContext = () => useContext(PseudoModeContext);

interface PseudoModeProviderProps {
  children: React.ReactNode;
  userId: number | null;
}

export const PseudoModeProvider: React.FC<PseudoModeProviderProps> = ({ children, userId }) => {
  const [isPseudoMode, setIsPseudoMode] = useState(false);

  const checkPseudoMode = async () => {
    if (!userId) {
      setIsPseudoMode(false);
      return;
    }

    try {
      const isActive = await invoke<boolean>('is_pseudo_mode_active', { userId });
      setIsPseudoMode(isActive);
    } catch (error) {
      console.error('Failed to check pseudo mode:', error);
      setIsPseudoMode(false);
    }
  };

  useEffect(() => {
    checkPseudoMode();
  }, [userId]);

  return (
    <PseudoModeContext.Provider value={{ isPseudoMode, checkPseudoMode }}>
      {children}
    </PseudoModeContext.Provider>
  );
};