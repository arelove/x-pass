/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

// SettingsPage/components/SecuritySection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Chip,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SecurityIcon from '@mui/icons-material/Security';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ShieldIcon from '@mui/icons-material/Shield';
import { useTranslation } from 'react-i18next';

interface SecuritySectionProps {
  photoSetting: boolean;
  onPhotoSettingChange: (checked: boolean) => void;
  pseudoModeEnabled: boolean;
  pseudoPasswordsCount: number;
  onOpenPseudoModeDialog: () => void;
}

interface IconBoxProps {
  color: 'primary' | 'warning' | 'secondary' | 'error' | 'info' | 'success';
  icon: React.ReactNode;
  size?: number;
}

const IconBox: React.FC<IconBoxProps> = ({ color, icon, size = 32 }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 1.5,
        bgcolor: alpha(theme.palette[color].main, 0.1),
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
  );
};

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  photoSetting,
  onPhotoSettingChange,
  pseudoModeEnabled,
  pseudoPasswordsCount,
  onOpenPseudoModeDialog,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Grid size={{ xs: 12 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card
          sx={{
            boxShadow: 3,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            {/* Header */}
            <Box
              display="flex"
              alignItems="center"
              gap={1.5}
              mb={2}
              pb={1.5}
              borderBottom={`2px solid ${alpha(theme.palette.warning.main, 0.1)}`}
            >
              <IconBox 
                color="warning" 
                icon={<SecurityIcon sx={{ color: 'warning.main', fontSize: 22 }} />}
              />
              <Typography variant="h6" fontWeight={700}>
                {t('settings.securitySettings')}
              </Typography>
            </Box>

            {/* Photo on Failed Login */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                mb: 2,
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <IconBox 
                  color="primary" 
                  icon={<CameraAltIcon sx={{ color: 'primary.main', fontSize: 18 }} />}
                  size={32}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={photoSetting}
                      onChange={(e) => onPhotoSettingChange(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={600}>
                      {t('settings.takePhotoOnFailedLogin')}
                    </Typography>
                  }
                  sx={{ flex: 1, m: 0 }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Pseudo Mode */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.warning.main, 0.03),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
              }}
            >
              <Box display="flex" alignItems="flex-start" gap={1.5}>
                <IconBox 
                  color="warning" 
                  icon={<ShieldIcon sx={{ color: 'warning.main', fontSize: 18 }} />}
                  size={32}
                />
                
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    {t('settings.pseudoMode.title')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    {t('settings.pseudoMode.shortDescription')}
                  </Typography>

                  {/* Status Chips */}
                  <Box display="flex" gap={1} alignItems="center" mb={1.5} flexWrap="wrap">
                    <Chip
                      label={
                        pseudoModeEnabled
                          ? t('settings.pseudoMode.enabled')
                          : t('settings.pseudoMode.disabled')
                      }
                      color={pseudoModeEnabled ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 600, height: 24 }}
                    />
                    
                    {pseudoModeEnabled && pseudoPasswordsCount > 0 && (
                      <Chip
                        label={`${pseudoPasswordsCount} ${t('settings.pseudoMode.passwordsCount')}`}
                        size="small"
                        variant="outlined"
                        color="warning"
                        sx={{ height: 24 }}
                      />
                    )}
                  </Box>

                  {/* Configure Button */}
                  <Button
                    variant="contained"
                    color="warning"
                    fullWidth
                    size="small"
                    startIcon={<SecurityIcon sx={{ fontSize: 18 }} />}
                    onClick={onOpenPseudoModeDialog}
                    sx={{
                      borderRadius: 1.5,
                      py: 1,
                      fontWeight: 600,
                      textTransform: 'none',
                    }}
                  >
                    {t('settings.pseudoMode.configure')}
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Grid>
  );
};