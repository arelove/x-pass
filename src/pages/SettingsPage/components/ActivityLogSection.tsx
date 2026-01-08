/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

// SettingsPage/components/ActivityLogSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  Grid
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from 'react-i18next';
import { ActivityLog } from '../types';

interface ActivityLogSectionProps {
  activityLogs: ActivityLog[];
  totalLogsCount: number; // ✅ Добавляем новый пропс
  onRefresh: () => void;
  onOpenStats: () => void;
  onClearLogs: () => void;
  onViewAll: () => void;
}

export const ActivityLogSection: React.FC<ActivityLogSectionProps> = ({
  activityLogs,
  totalLogsCount, // ✅ Получаем общее количество
  onRefresh,
  onOpenStats,
  onClearLogs,
  onViewAll,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'login': return <LoginIcon color="success" fontSize="small" />;
      case 'logout': return <LogoutIcon color="error" fontSize="small" />;
      case 'add_entry': return <AddIcon color="primary" fontSize="small" />;
      case 'edit_entry': return <EditIcon color="info" fontSize="small" />;
      case 'delete_entry': return <DeleteIcon color="error" fontSize="small" />;
      case 'view_entry': return <VisibilityIcon color="action" fontSize="small" />;
      case 'account_created': return <PersonIcon color="success" fontSize="small" />;
      case 'account_deleted': return <DeleteIcon color="error" fontSize="small" />;
      case 'login_failed': return <CloseIcon color="error" fontSize="small" />;
      case 'pseudo_login_access': return <SecurityIcon color="warning" fontSize="small" />;
      case 'vault_exported': return <FileDownloadIcon color="success" fontSize="small" />;
      case 'vault_imported': return <FileUploadIcon color="success" fontSize="small" />;
      case 'pseudo_password_added': return <VpnKeyIcon color="warning" fontSize="small" />;
      case 'pseudo_mode_settings_updated': return <SettingsIcon color="info" fontSize="small" />;
      default: return <HistoryIcon fontSize="small" />;
    }
  };

  return (
    <Grid size={{ xs: 12 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  {t('settings.activityLog')}
                </Typography>
                {/* ✅ Используем totalLogsCount вместо activityLogs.length */}
                <Chip label={totalLogsCount} size="small" color="primary" />
              </Box>
              <Stack direction="row" spacing={1}>
                <Tooltip title={t('settings.refreshLogs')}>
                  <IconButton onClick={onRefresh} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('settings.statistics')}>
                  <IconButton onClick={onOpenStats} size="small">
                    <BarChartIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('settings.clearLogs')}>
                  <IconButton onClick={onClearLogs} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('settings.viewAll')}>
                  <IconButton onClick={onViewAll} size="small" color="primary">
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            
            <List sx={{ maxHeight: 180, overflow: 'auto' }}>
              {activityLogs.slice(0, 3).map((log) => (
                <ListItem
                  key={log.id}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    py: 0.5,
                    px: 1.5,
                    minHeight: 'auto',
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, minHeight: 32 }}>
                    {getActivityIcon(log.action_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={t(`settings.activity.${log.action_type}`)}
                    secondary={`${log.details} • ${new Date(log.timestamp).toLocaleString()}`}
                    primaryTypographyProps={{ 
                      variant: 'body2', 
                      fontWeight: 500,
                      sx: { lineHeight: 1.6 }
                    }}
                    secondaryTypographyProps={{ 
                      variant: 'caption',
                      sx: { lineHeight: 1.6 }
                    }}
                    sx={{ my: 0 }}
                  />
                </ListItem>
              ))}
              {activityLogs.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  {t('settings.noActivity')}
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </motion.div>
    </Grid>
  );
};