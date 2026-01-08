/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

// SettingsPage/components/LanguageThemeSection.tsx
import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  TextField,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Grid
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import PaletteIcon from '@mui/icons-material/Palette';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { ThemeContext, ThemeMode } from '../../../context/theme/ThemeContext';
import { FlagIconCached } from './FlagIconCached';

interface LanguageThemeSectionProps {
  themeName: string;
  themeError: string;
  colorFields: Array<{ label: string; field: string; value: string }>;
  onThemeNameChange: (name: string) => void;
  onColorClick: (field: string) => () => void;
  onSaveTheme: () => void;
  onDeleteTheme: (name: string) => (e: React.MouseEvent) => void;
  photoSetting: boolean;
  onPhotoSettingChange: (enabled: boolean) => void;
}

export const LanguageThemeSection: React.FC<LanguageThemeSectionProps> = ({
  themeName,
  themeError,
  colorFields,
  onThemeNameChange,
  onColorClick,
  onSaveTheme,
  onDeleteTheme,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { mode, toggleTheme, customThemes } = useContext(ThemeContext);
  const [flagScale] = useState<number>(1.5);

  const languages = [
    { code: 'en', countryCode: 'GB', name: 'English' },
    { code: 'ru', countryCode: 'RU', name: 'Ð ÑƒÑÑÐºÐ¸Ð¹' },
    { code: 'zh', countryCode: 'CN', name: 'ä¸­æ–‡' },
    { code: 'es', countryCode: 'ES', name: 'EspaÃ±ol' },
    { code: 'pt', countryCode: 'BR', name: 'PortuguÃªs' },
    { code: 'fr', countryCode: 'FR', name: 'FranÃ§ais' },
    { code: 'de', countryCode: 'DE', name: 'Deutsch' },
    { code: 'ja', countryCode: 'JP', name: 'æ—¥æœ¬èªž' },
    { code: 'ko', countryCode: 'KR', name: 'í•œêµ­ì–´' },
    { code: 'it', countryCode: 'IT', name: 'Italiano' },
    { code: 'ar', countryCode: 'SA', name: 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©' },
    { code: 'hi', countryCode: 'IN', name: 'à¤¹à¤¿à¤¨à¥à¤¦à¥€' },
    { code: 'id', countryCode: 'ID', name: 'Bahasa Indonesia' },
  ];

  return (
    <>
      <Grid size={{ xs: 6, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              position: 'relative',
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LanguageIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    {t('language')}
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  spacing={0}
                  sx={{
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start',
                    gap: 1,
                  }}
                >
                  {languages.map((lang) => (
                    <Tooltip key={lang.code} title={lang.name} arrow placement="top">
                      <Box
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: i18n.language === lang.code
                            ? `3px solid ${theme.palette.primary.main}`
                            : `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                          boxShadow: i18n.language === lang.code ? 3 : 0,
                          p: 0,
                          bgcolor: i18n.language === lang.code 
                            ? alpha(theme.palette.primary.main, 0.1)
                            : 'transparent',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: 2,
                          },
                        }}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          localStorage.setItem('language', lang.code);
                        }}
                      >
                        <Box
                          sx={{
                            transform: `scale(${flagScale})`,
                            transformOrigin: 'center',
                            transition: 'transform 0.3s ease',
                          }}
                        >
                          <FlagIconCached countryCode={lang.countryCode} size={25} />
                        </Box>
                      </Box>
                    </Tooltip>
                  ))}
                </Stack>
              </Stack>
            </CardContent>

            
          </Card>
        </motion.div>
      </Grid>

      <Grid size={{ xs: 6, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaletteIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    {t('theme')}
                  </Typography>
                </Box>
                
                <FormControl fullWidth>
                  <InputLabel>{t('theme')}</InputLabel>
                  <Select
                    value={mode}
                    onChange={(e) => toggleTheme(e.target.value as ThemeMode)}
                    label={t('theme')}
                  >
                    <MenuItem value="light">{t('theme.light')}</MenuItem>
                    <MenuItem value="dark">{t('theme.dark')}</MenuItem>
                    <MenuItem value="fallout">{t('theme.fallout')}</MenuItem>
                    <MenuItem value="cyberpunk">{t('theme.cyberpunk')}</MenuItem>
                    <MenuItem value="ocean">{t('theme.ocean')}</MenuItem>
                    <MenuItem value="sunset">{t('theme.sunset')}</MenuItem>
                   <MenuItem value="sand">{t('theme.sand')}</MenuItem>
                    <MenuItem value="neon">{t('theme.neon')}</MenuItem>
                    <MenuItem value="toxic">{t('theme.toxic')}</MenuItem>
                   
                    <MenuItem value="dracula">{t('theme.dracula')}</MenuItem>
                    <MenuItem value="custom">{t('theme.custom')}</MenuItem>

                    
                    {customThemes.map((theme) => (
                      <MenuItem key={theme.name} value={theme.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          {theme.name}
                          <IconButton
                            size="small"
                            onClick={onDeleteTheme(theme.name)}
                            sx={{ ml: 1 }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {(mode === 'custom' || customThemes.some((t) => t.name === mode)) && (
                  <Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                      {colorFields.map((item) => (
                        <Tooltip key={item.field} title={item.label}>
                          <Box
                            onClick={onColorClick(item.field)}
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: item.value,
                              border: `2px solid ${theme.palette.divider}`,
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                              '&:hover': { transform: 'scale(1.2)' },
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Stack>
                    
                    <Stack direction="row" spacing={1}>
                      <TextField
                        label={t('settings.themeName')}
                        value={themeName}
                        onChange={(e) => onThemeNameChange(e.target.value)}
                        size="small"
                        fullWidth
                        error={!!themeError}
                        helperText={themeError}
                      />
                      <IconButton
                        onClick={onSaveTheme}
                        color="primary"
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                      >
                        <SaveIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </>
  );
};
