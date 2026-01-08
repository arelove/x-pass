/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
import React, { createContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, PaletteMode } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightThemeConfig, lightThemeStyles } from './themes/light';
import { darkThemeConfig, darkThemeStyles } from './themes/dark';
import { falloutThemeConfig, falloutThemeStyles } from './themes/fallout';
import { draculaThemeConfig, draculaThemeStyles } from './themes/dracula';
import { cyberpunkThemeConfig, cyberpunkThemeStyles } from './themes/cyberpunk';
import { oceanThemeConfig, oceanThemeStyles } from './themes/ocean';
import { sunsetThemeConfig, sunsetThemeStyles } from './themes/sunset';
import { sandThemeConfig, sandThemeStyles } from './themes/sand';
import { neonThemeConfig, neonThemeStyles } from './themes/neon';
import { toxicThemeConfig, toxicThemeStyles } from './themes/toxic';

export type ThemeMode = 'light' | 'dark' | 'fallout' | 'dracula' | 'cyberpunk' | 'ocean' | 'sunset' | 'sand' | 'neon' | 'toxic' | string;

export interface CustomTheme {
  name: string;
  primary: string;
  backgroundDefault: string;
  backgroundPaper: string;
  textPrimary: string;
  textSecondary: string;
}

export const ThemeContext = createContext<{
  mode: ThemeMode;
  toggleTheme: (newMode: ThemeMode) => void;
  customTheme: CustomTheme;
  updateCustomTheme: (updates: Partial<CustomTheme>) => void;
  customThemes: CustomTheme[];
  saveCustomTheme: (name: string) => void;
  deleteCustomTheme: (name: string) => void;
}>({
  mode: 'dark',
  toggleTheme: () => {},
  customTheme: {
    name: 'custom',
    primary: '#903190ff',
    backgroundDefault: '#1a0033',
    backgroundPaper: '#2a0044',
    textPrimary: '#ffffff',
    textSecondary: '#cccccc',
  },
  updateCustomTheme: () => {},
  customThemes: [],
  saveCustomTheme: () => {},
  deleteCustomTheme: () => {},
});

const themeRegistry: Record<string, { config: any; styles: any }> = {
  light: { config: lightThemeConfig, styles: lightThemeStyles },
  dark: { config: darkThemeConfig, styles: darkThemeStyles },
  fallout: { config: falloutThemeConfig, styles: falloutThemeStyles },
  dracula: { config: draculaThemeConfig, styles: draculaThemeStyles },
  cyberpunk: { config: cyberpunkThemeConfig, styles: cyberpunkThemeStyles },
  ocean: { config: oceanThemeConfig, styles: oceanThemeStyles },
  sunset: { config: sunsetThemeConfig, styles: sunsetThemeStyles },
  sand: { config: sandThemeConfig, styles: sandThemeStyles },
  neon: { config: neonThemeConfig, styles: neonThemeStyles },
  toxic: { config: toxicThemeConfig, styles: toxicThemeStyles },
};

const ThemeProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('themeMode') as ThemeMode) || 'dark';
  });

  const [customTheme, setCustomTheme] = useState<CustomTheme>(() => {
    const saved = localStorage.getItem('customTheme');
    return saved
      ? JSON.parse(saved)
      : {
          name: 'custom',
          primary: '#ff00ff',
          backgroundDefault: '#1a0033',
          backgroundPaper: '#2a0044',
          textPrimary: '#ffffff',
          textSecondary: '#cccccc',
        };
  });

  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => {
    const saved = localStorage.getItem('customThemes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('customTheme', JSON.stringify(customTheme));
  }, [customTheme]);

  useEffect(() => {
    localStorage.setItem('customThemes', JSON.stringify(customThemes));
  }, [customThemes]);

  const toggleTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    
    const predefinedThemes = ['light', 'dark', 'fallout', 'dracula', 'cyberpunk', 'ocean', 'sunset', 'sand', 'neon', 'toxic', 'custom'];
    if (!predefinedThemes.includes(newMode)) {
      const selectedTheme = customThemes.find((theme) => theme.name === newMode);
      if (selectedTheme) {
        setCustomTheme(selectedTheme);
      }
    }
  };

  const updateCustomTheme = (updates: Partial<CustomTheme>) => {
    setCustomTheme((prev) => ({ ...prev, ...updates }));
  };

  const saveCustomTheme = (name: string) => {
    if (!name.trim()) return;
    if (customThemes.some((theme) => theme.name === name)) return;
    
    const newTheme = { ...customTheme, name };
    setCustomThemes((prev) => [...prev, newTheme]);
    setMode(name);
  };

  const deleteCustomTheme = (name: string) => {
    if (mode === name) {
      setMode('custom');
      setCustomTheme({
        name: 'custom',
        primary: '#ff00ff',
        backgroundDefault: '#1a0033',
        backgroundPaper: '#2a0044',
        textPrimary: '#ffffff',
        textSecondary: '#cccccc',
      });
    }
    setCustomThemes((prev) => prev.filter((theme) => theme.name !== name));
  };

  const theme = useMemo(() => {
    const paletteMode: PaletteMode = mode === 'light' ? 'light' : 'dark';
    
    const currentTheme = themeRegistry[mode];
    const themeConfig = currentTheme?.config;
    const themeStyles = currentTheme?.styles;

    return createTheme({
      palette: {
        mode: paletteMode,
        ...(themeConfig || {
          primary: { main: customTheme.primary },
          secondary: { main: customTheme.primary },
          success: { main: '#10b981' },
          error: { main: '#ef4444' },
          background: {
            default: customTheme.backgroundDefault,
            paper: customTheme.backgroundPaper,
          },
          text: {
            primary: customTheme.textPrimary,
            secondary: customTheme.textSecondary,
          },
        }),
      },
      shape: { borderRadius: 12 },
      typography: {
        fontFamily: themeStyles?.fontFamily || '"Inter", "Helvetica Neue", Arial, sans-serif',
        h4: {
          fontWeight: 700,
          fontSize: '2rem',
          ...(themeStyles?.textShadow && { textShadow: themeStyles.textShadow }),
          ...(themeStyles?.letterSpacing && { letterSpacing: themeStyles.letterSpacing }),
        },
        h6: {
          fontWeight: 600,
          fontSize: '1.25rem',
          ...(themeStyles?.textShadow && { textShadow: themeStyles.textShadow }),
          ...(themeStyles?.letterSpacing && { letterSpacing: themeStyles.letterSpacing }),
        },
        body1: {
          fontSize: '1rem',
          lineHeight: 1.5,
          ...(themeStyles?.textShadow && { textShadow: themeStyles.textShadow }),
        },
        body2: {
          fontSize: '0.875rem',
          lineHeight: 1.43,
          ...(themeStyles?.textShadow && { textShadow: themeStyles.textShadow }),
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: `
            * {
              position: relative;
              z-index: 10;
            }
            body {
              transition: background 0.4s ease, color 0.4s ease;
              background: ${themeStyles?.background || `linear-gradient(135deg, ${customTheme.backgroundDefault} 0%, ${customTheme.backgroundPaper} 100%)`};
              ${themeStyles?.hasScanlines ? `
                background-image: 
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    ${themeConfig?.primary.main}09 2px,
                    ${themeConfig?.primary.main}09 4px
                  );
              ` : ''}
            }
            pre {
              background-color: ${themeStyles?.preBackground || 'rgba(255, 255, 255, 0.05)'};
              color: inherit;
              padding: 16px;
              border-radius: 8px;
              margin: 8px 0;
              overflow-x: auto;
              font-family: ${themeStyles?.fontFamily || '"JetBrains Mono", monospace'};
              transition: background-color 0.4s ease;
              ${themeStyles?.border ? `border: ${themeStyles.border};` : ''}
            }
            ::selection {
              background: ${themeStyles?.selection || `${customTheme.primary}99`};
              color: ${themeStyles?.selectionColor || customTheme.textPrimary};
            }
            ::-moz-selection {
              background: ${themeStyles?.selection || `${customTheme.primary}99`};
              color: ${themeStyles?.selectionColor || customTheme.textPrimary};
            }
            ${themeStyles?.hasEffects ? `
              h1, h2, h3, h4, h5, h6 {
                text-shadow: ${themeStyles.textShadow};
              }
            ` : ''}
            ${themeStyles?.hasFlicker ? `
              @keyframes flicker {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.95; }
              }
              body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  ${themeConfig?.primary.main}08 2px,
                  ${themeConfig?.primary.main}08 4px
                );
                pointer-events: none;
                animation: flicker 0.15s infinite;
                z-index: 9999;
              }
            ` : ''}
            ${themeStyles?.hasAnimatedBackground ? themeStyles.animationCSS : ''}
          `,
        },
        MuiCard: {
          styleOverrides: {
            root: {
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: themeConfig?.background.paper || customTheme.backgroundPaper,
              ...(themeStyles?.border && { border: themeStyles.border }),
              ...(themeStyles?.boxShadow && { boxShadow: themeStyles.boxShadow }),
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: themeStyles?.boxShadow || '0 12px 24px rgba(0, 0, 0, 0.15)',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              transition: 'transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
              backgroundColor: themeConfig?.primary.main || customTheme.primary,
              ...(themeStyles?.border && { border: themeStyles.border }),
              ...(themeStyles?.textShadow && { textShadow: themeStyles.textShadow }),
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: themeStyles?.boxShadow || '0 4px 12px rgba(0, 0, 0, 0.1)',
                backgroundColor: `${themeConfig?.primary.main || customTheme.primary}cc`,
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            root: {
              transition: 'all 0.2s ease',
              ...(themeStyles?.border && { border: themeStyles.border }),
              '&:hover': {
                backgroundColor: `${themeConfig?.primary.main || customTheme.primary}11`,
              },
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              transition: 'all 0.2s ease',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: `${themeConfig?.primary.main || customTheme.primary}80`,
              },
            },
          },
        },
      },
    });
  }, [mode, customTheme]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, customTheme, updateCustomTheme, customThemes, saveCustomTheme, deleteCustomTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProviderWrapper;
