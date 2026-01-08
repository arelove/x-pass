/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

// components/FlagIcon.tsx
import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Box, CircularProgress } from '@mui/material';

interface FlagIconProps {
  countryCode: string;
  size?: number;
}

export const FlagIcon: React.FC<FlagIconProps> = ({ countryCode, size = 24 }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFlag = async () => {
      try {
        const svg = await invoke<string>('get_flag', { countryCode });
        setSvgContent(svg);
      } catch (error) {
        console.error('Failed to load flag:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlag();
  }, [countryCode]);

  if (loading) {
    return (
      <Box sx={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={size / 2} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& svg': {
          width: '100%',
          height: '100%',
        },
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};
