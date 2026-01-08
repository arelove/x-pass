/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

// components/FlagIconCached.tsx
import React from 'react';
import { Box } from '@mui/material';
import { useFlags } from '../hooks/useFlags';

interface FlagIconCachedProps {
  countryCode: string;
  size?: number;
}

export const FlagIconCached: React.FC<FlagIconCachedProps> = ({ 
  countryCode, 
  size = 24 
}) => {
  const { flags, loading } = useFlags();

  if (loading || !flags[countryCode]) {
    return <Box sx={{ width: size, height: size }} />;
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
      dangerouslySetInnerHTML={{ __html: flags[countryCode] }}
    />
  );
};
