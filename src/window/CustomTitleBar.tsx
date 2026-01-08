import React, { useEffect, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Box, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MaximizeIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { ThemeContext } from '../context/theme/ThemeContext';

const CustomTitleBar: React.FC = () => {
  const { t } = useTranslation();
  const { mode, toggleTheme } = useContext(ThemeContext);
  const [isNetworkEnabled, setIsNetworkEnabled] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Initialize network state (default: disabled)
    invoke('toggle_network', { enable: false })
      .then((enabled) => setIsNetworkEnabled(enabled as boolean))
      .catch((error) => console.error('Error initializing network state:', error));
  }, []);

  const handleNetworkToggle = async () => {
    try {
      const newState = await invoke('toggle_network', { enable: !isNetworkEnabled });
      setIsNetworkEnabled(newState as boolean);
    } catch (error) {
      console.error('Error toggling network:', error);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMinimize = async () => {
    try {
      await invoke('minimize_window');
    } catch (error) {
      console.error('Error minimizing window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      await invoke('toggle_maximize');
      setIsMaximized(!isMaximized);
    } catch (error) {
      console.error('Error toggling maximize:', error);
    }
  };

  const handleClose = async () => {
    try {
      await invoke('close_window');
    } catch (error) {
      console.error('Error closing window:', error);
    }
  };

  const handleToggleTheme = () => {
    const nextMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'custom' : 'light';
    toggleTheme(nextMode);
  };

  const handleHelp = () => {
    console.log('Opening help documentation');
  };

  const handleRefresh = async () => {
    try {
      await invoke('refresh_app');
    } catch (error) {
      console.error('Error refreshing app:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 32,
        background: 'transparent',
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        px: 1,
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
      }}
      onDoubleClick={handleDoubleClick}
      data-tauri-drag-region
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}></Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={t(isNetworkEnabled ? 'titlebar.networkOn' : 'titlebar.networkOff')}>
          <IconButton
            size="small"
            onClick={handleNetworkToggle}
            sx={{ color: isNetworkEnabled ? 'success.main' : 'error.main' }}
          >
            {isNetworkEnabled ? <WifiIcon fontSize="inherit" /> : <WifiOffIcon fontSize="inherit" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('titlebar.toggleTheme')}>
          <IconButton size="small" onClick={handleToggleTheme}>
            {mode === 'light' ? <DarkModeIcon fontSize="inherit" /> : mode === 'dark' ? <LightModeIcon fontSize="inherit" /> : <LightModeIcon fontSize="inherit" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('titlebar.help')}>
          <IconButton size="small" onClick={handleHelp}>
            <HelpOutlineIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('titlebar.refresh')}>
          <IconButton size="small" onClick={handleRefresh}>
            <RefreshIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('titlebar.minimize')}>
          <IconButton size="small" onClick={handleMinimize}>
            <MinimizeIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t(isMaximized ? 'titlebar.restore' : 'titlebar.maximize')}>
          <IconButton size="small" onClick={handleMaximize}>
            {isMaximized ? <FullscreenExitIcon fontSize="inherit" /> : <MaximizeIcon fontSize="inherit" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('titlebar.close')}>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'error.main' }}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default CustomTitleBar;
