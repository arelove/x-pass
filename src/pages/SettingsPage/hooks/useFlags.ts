/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

// hooks/useFlags.ts
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

const flagsCache: Record<string, string> = {};

export const useFlags = () => {
  const [flags, setFlags] = useState<Record<string, string>>(flagsCache);
  const [loading, setLoading] = useState(Object.keys(flagsCache).length === 0);

  useEffect(() => {
    if (Object.keys(flagsCache).length === 0) {
      const loadAllFlags = async () => {
        try {
          const allFlags = await invoke<Record<string, string>>('get_all_flags');
          Object.assign(flagsCache, allFlags);
          setFlags(allFlags);
        } catch (error) {
          console.error('Failed to load flags:', error);
        } finally {
          setLoading(false);
        }
      };

      loadAllFlags();
    } else {
      setLoading(false);
    }
  }, []);

  return { flags, loading };
};
