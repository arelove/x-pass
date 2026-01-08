/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
import React, { useState } from 'react';
import { Box, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTranslation } from 'react-i18next';

const Sidebar: React.FC = () => {
  const [mode, setMode] = useState<'closed' | 'icons' | 'full'>('closed');
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const toggleSidebar = () => {
    setMode((prev) => {
      if (prev === 'closed') return 'icons';
      if (prev === 'icons') return 'full';
      return 'closed';
    });
  };

  const menuItems = [
    { text: t('vault.title'), icon: <HomeIcon />, path: '/' },
    { text: t('settings'), icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Toggle button */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          ml: mode === 'closed' ? '1px' : mode === 'icons' ? '56px' : '201px',
          zIndex: 1200,
          
        }}
      >
        <IconButton onClick={toggleSidebar}>
          {mode === 'closed' || mode === 'icons' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Main sidebar container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: mode === 'closed' ? 0 : mode === 'icons' ? 55 : 200,
          background: 'transparent',
          transition: 'width 0.3s',
          overflow: 'hidden',
          borderRight: mode === 'closed' ? 'none' : '1px solid',
          borderColor: 'divider',
          
        }}
      >
        {mode !== 'closed' && (
          <>
            <List sx={{ pt: 2 }}>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <Tooltip title={mode === 'icons' ? item.text : ''} placement="right">
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        py: 1.5,
                        position: 'relative',
                        ...(location.pathname === item.path && {
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            bottom: 0,
                            width: '4px',
                            height: '100%',
                            backgroundColor: 'primary.main',
                            transition: 'background-color 0.2s ease',
                            
                          },
                        }),
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: mode === 'full' ? 40 : 40, color: 'text.primary' }}>
                        {item.icon}
                      </ListItemIcon>
                      {mode === 'full' && (
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{
                            fontWeight: location.pathname === item.path ? 700 : 500,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
            
          </>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
