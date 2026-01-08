/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
// SettingsPage/hooks/useActivityLogs.ts

import { useState, useEffect, useContext } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../../context/AuthContext';
import { SnackbarContext } from '../../../components/SnackbarProvider';
import { ActivityLog, ActivityStats, ActivityTrend } from '../types';
import * as XLSX from 'xlsx';

export const useActivityLogs = () => {
  const { t } = useTranslation();
  const { auth } = useContext(AuthContext);
  const { showMessage } = useContext(SnackbarContext)!;

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityLog[]>([]); 
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [activityTrend, setActivityTrend] = useState<ActivityTrend[]>([]);
  const [trendDays, setTrendDays] = useState(30);

  const [openActivityDialog, setOpenActivityDialog] = useState(false);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [openChartDialog, setOpenChartDialog] = useState(false);
  const [selectedChart, setSelectedChart] = useState<'line' | 'pie' | 'bar' | null>(null);
  const [openDeleteLogsDialog, setOpenDeleteLogsDialog] = useState(false);
  const [deleteDialogPassword, setDeleteDialogPassword] = useState('');

  const loadActivityLogs = async () => {
  if (auth) {
    try {
      const logs = await invoke<ActivityLog[]>('get_activity_logs', { 
        userId: auth.user_id, 
        limit: 100
      });
      setActivityLogs(logs);
      
      const allLogs = await invoke<ActivityLog[]>('get_activity_logs', { 
        userId: auth.user_id, 
        limit: -1
      });
      setAllActivityLogs(allLogs);
      
      const count = await invoke<number>('get_activity_count', {
        userId: auth.user_id
      });
      setTotalLogsCount(count);
        
        const stats = await invoke<ActivityStats>('get_activity_stats', { 
          userId: auth.user_id 
        });
        setActivityStats(stats);
        
        const trend = await invoke<ActivityTrend[]>('get_activity_trend', { 
          userId: auth.user_id, 
          days: trendDays 
        });
        setActivityTrend(trend);
      } catch (err) {
        console.error('Failed to load activity logs:', err);
      }
    }
  };

  const loadActivityTrend = async () => {
    if (auth) {
      try {
        const trend = await invoke<ActivityTrend[]>('get_activity_trend', { 
          userId: auth.user_id, 
          days: trendDays 
        });
        setActivityTrend(trend);
      } catch (err) {
        console.error('Failed to load activity trend:', err);
      }
    }
  };

  const handleExportLogs = async () => {
    if (auth) {
      try {
        const logsToExport = allActivityLogs.length > 0 ? allActivityLogs : activityLogs;
        const data = logsToExport.map((log, index) => ({
          '#': index + 1,
          [t('settings.activityLogDialog.actionType')]: t(`settings.activity.${log.action_type}`),
          [t('settings.activityLogDialog.details')]: log.details,
          [t('settings.activityLogDialog.timestamp')]: new Date(log.timestamp).toLocaleString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t('settings.activityLog'));
        worksheet['!cols'] = [
          { wch: 5 },   // #
          { wch: 30 },  // Action Type
          { wch: 50 },  // Details
          { wch: 25 },  // Timestamp
        ];

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity_logs_${auth.username}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showMessage(t('settings.logsExported'), 'success');
      } catch (err) {
        console.error('Export failed:', err);
        showMessage(t('settings.logsExportFailed'), 'error');
      }
    }
  };

  const handleScheduleLogsDeletion = async () => {
    if (auth && deleteDialogPassword) {
      try {
        await invoke('schedule_logs_deletion', {
          userId: auth.user_id,
          password: deleteDialogPassword
        });
        setOpenDeleteLogsDialog(false);
        setDeleteDialogPassword('');
        showMessage(t('settings.logsDeletionScheduled'), 'success');
        await loadActivityLogs();
      } catch (err) {
        showMessage(t('settings.invalidPassword'), 'error');
      }
    }
  };

  const handleClearLogs = () => {
    setOpenDeleteLogsDialog(true);
  };

  const handleOpenChart = (chartType: 'line' | 'pie' | 'bar') => {
    setSelectedChart(chartType);
    setOpenChartDialog(true);
  };

  useEffect(() => {
    loadActivityLogs();
  }, [auth]);

  useEffect(() => {
    if (auth && openStatsDialog) {
      loadActivityTrend();
    }
  }, [trendDays, openStatsDialog]);

  return {
    activityLogs,
    allActivityLogs,
    totalLogsCount,
    activityStats,
    activityTrend,
    trendDays,
    setTrendDays,
    openActivityDialog,
    setOpenActivityDialog,
    openStatsDialog,
    setOpenStatsDialog,
    openChartDialog,
    setOpenChartDialog,
    selectedChart,
    openDeleteLogsDialog,
    setOpenDeleteLogsDialog,
    deleteDialogPassword,
    setDeleteDialogPassword,
    loadActivityLogs,
    handleExportLogs,
    handleScheduleLogsDeletion,
    handleClearLogs,
    handleOpenChart,
  };
};
