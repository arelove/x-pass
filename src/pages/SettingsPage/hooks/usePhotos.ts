// SettingsPage/hooks/usePhotos.ts
import { useState, useEffect, useContext, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../../../context/AuthContext';
import { SnackbarContext } from '../../../components/SnackbarProvider';
import { ThemeContext } from '../../../context/theme/ThemeContext';
import { generateSecurityReport } from '../utils/reportGenerator';

interface FailedLoginPhoto {
  id: number;
  user_id: number;
  photo_data: string;
  timestamp: string;
  username_attempt: string;
}

interface ActivityStats {
  total_logins: number;
  total_actions: number;
  last_login: string | null;
  most_active_day: string | null;
  actions_by_type: Array<{ action_type: string; count: number }>;
}

export const usePhotos = () => {
  const { t, i18n } = useTranslation();
  const { auth } = useContext(AuthContext);
  const { showMessage } = useContext(SnackbarContext)!;
  const { mode } = useContext(ThemeContext);
  const muiTheme = useTheme();

  const [photoSetting, setPhotoSetting] = useState(false);
  const [failedLoginPhotos, setFailedLoginPhotos] = useState<FailedLoginPhoto[]>([]);
  const [openPhotosDialog, setOpenPhotosDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);
  const [openDeletePhotoDialog, setOpenDeletePhotoDialog] = useState(false);
  const [deletePhotoPassword, setDeletePhotoPassword] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'username'>('date');

  const loadPhotoSetting = async () => {
    if (auth) {
      try {
        const enabled = await invoke<boolean>('get_photo_setting', { userId: auth.user_id });
        setPhotoSetting(enabled);
      } catch (err) {
        console.error('Failed to load photo setting:', err);
      }
    }
  };

  const loadFailedLoginPhotos = async () => {
    if (auth) {
      try {
        const photos = await invoke<FailedLoginPhoto[]>('get_failed_login_photos', { 
          userId: auth.user_id 
        });
        setFailedLoginPhotos(photos);
      } catch (err) {
        console.error('Failed to load photos:', err);
      }
    }
  };

  const handlePhotoSettingChange = async (enabled: boolean) => {
    if (auth) {
      try {
        await invoke('update_photo_setting', { userId: auth.user_id, enabled });
        setPhotoSetting(enabled);
        showMessage(t('settings.photoSettingUpdated'), 'success');
      } catch (err) {
        showMessage(t('settings.photoSettingFailed'), 'error');
      }
    }
  };

  const handleViewPhoto = (photoData: string) => {
    setSelectedPhoto(photoData);
  };

  const handleBulkDeleteClick = () => {
    setPhotoToDelete(null);
    setOpenDeletePhotoDialog(true);
  };

  const handleDeletePhotoClick = (photoId: number) => {
    setPhotoToDelete(photoId);
    setSelectedPhotos([]);
    setOpenDeletePhotoDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!auth || !deletePhotoPassword) return;

    try {
      await invoke('verify_user_password', { 
        userId: auth.user_id, 
        password: deletePhotoPassword 
      });

      if (photoToDelete !== null) {
        await invoke('delete_failed_login_photo', { 
          photoId: photoToDelete, 
          userId: auth.user_id 
        });
        showMessage(t('settings.photoDeleted'), 'success');
      } else if (selectedPhotos.length > 0) {
        for (const photoId of selectedPhotos) {
          await invoke('delete_failed_login_photo', { 
            photoId, 
            userId: auth.user_id 
          });
        }
        showMessage(t('settings.photosDeleted', { count: selectedPhotos.length }), 'success');
        setSelectedPhotos([]);
      }

      await loadFailedLoginPhotos();
      setOpenDeletePhotoDialog(false);
      setPhotoToDelete(null);
      setDeletePhotoPassword('');
    } catch (err) {
      console.error('Delete error:', err);
      showMessage(t('settings.invalidPassword'), 'error');
    }
  };

  const handleToggleSelectPhoto = (photoId: number) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === filteredPhotos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(filteredPhotos.map(p => p.id));
    }
  };

  const handleExportJSON = () => {
    const data = filteredPhotos.map(photo => ({
      timestamp: photo.timestamp,
      username_attempt: photo.username_attempt,
      date: new Date(photo.timestamp).toLocaleString()
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_login_photos_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage(t('settings.exportedSuccessfully'), 'success');
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Username Attempt', 'Date'];
    const rows = filteredPhotos.map(photo => [
      photo.timestamp,
      photo.username_attempt,
      new Date(photo.timestamp).toLocaleString()
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_login_photos_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage(t('settings.exportedSuccessfully'), 'success');
  };

  const handleExportExcel = async () => {
    let activityStats: ActivityStats | null = null;
    
    if (auth) {
      try {
        activityStats = await invoke<ActivityStats>('get_activity_stats', { 
          userId: auth.user_id 
        });
      } catch (err) {
        console.error('Failed to load activity stats:', err);
      }
    }

    const texts = {
      title: t('settings.securityReport'),
      generatedAt: t('settings.reportGeneratedAt'),
      summary: t('settings.summary'),
      totalAttempts: t('settings.totalFailedAttempts'),
      uniqueUsers: t('settings.uniqueUsernames'),
      mostActiveUser: t('settings.mostActiveUser'),
      peakHour: t('settings.peakHour'),
      detailedLog: t('settings.detailedLog'),
      timestamp: t('settings.timestamp'),
      username: t('settings.username'),
      date: t('settings.date'),
      photo: t('settings.photo'),
      noPhoto: t('settings.noPhoto'),
      totalLogins: t('settings.totalLogins'),
      totalActions: t('settings.totalActions'),
      lastLogin: t('settings.lastLogin'),
      mostActiveDay: t('settings.mostActiveDay'),
      searchPlaceholder: t('settings.searchReport'),
      printReport: t('settings.printReport'),
      riskLevel: t('settings.riskLevel'),
      low: t('settings.riskLow'),
      medium: t('settings.riskMedium'),
      high: t('settings.riskHigh'),
      critical: t('settings.riskCritical'),
      'report.warning.title': t('report.warning.title'),
      'report.warning.message': t('report.warning.message'),
      'report.warning.close': t('report.warning.close'),
      photoGallery: t('settings.photoGallery')
    };

    const html = generateSecurityReport({
      filteredPhotos,
      activityStats,
      texts,
      language: i18n.language,
      theme: {
        mode: mode,
        primary: muiTheme.palette.primary.main,
        secondary: muiTheme.palette.secondary?.main,
        success: muiTheme.palette.success?.main,
        error: muiTheme.palette.error?.main,
        backgroundDefault: muiTheme.palette.background.default,
        backgroundPaper: muiTheme.palette.background.paper,
        textPrimary: muiTheme.palette.text.primary,
        textSecondary: muiTheme.palette.text.secondary,
        paletteMode: muiTheme.palette.mode,
      }
    });

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_report_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage(t('settings.exportedSuccessfully'), 'success');
  };

  const filteredPhotos = useMemo(() => {
    let filtered = [...failedLoginPhotos];
    
    if (searchQuery) {
      filtered = filtered.filter(photo => 
        photo.username_attempt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    const now = new Date();
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(photo => new Date(photo.timestamp) >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(photo => new Date(photo.timestamp) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(photo => new Date(photo.timestamp) >= monthAgo);
    }
    
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'username') {
      filtered.sort((a, b) => a.username_attempt.localeCompare(b.username_attempt));
    }
    
    return filtered;
  }, [failedLoginPhotos, searchQuery, dateFilter, sortBy]);

  useEffect(() => {
    loadPhotoSetting();
    loadFailedLoginPhotos();
  }, [auth]);

  return {
    photoSetting,
    failedLoginPhotos,
    filteredPhotos,
    openPhotosDialog,
    setOpenPhotosDialog,
    selectedPhoto,
    setSelectedPhoto,
    openDeletePhotoDialog,
    setOpenDeletePhotoDialog,
    deletePhotoPassword,
    setDeletePhotoPassword,
    selectedPhotos,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    sortBy,
    setSortBy,
    handlePhotoSettingChange,
    handleViewPhoto,
    handleDeletePhotoClick,
    photoToDelete,
    handleBulkDeleteClick,
    handleConfirmDelete,
    handleToggleSelectPhoto,
    handleSelectAll,
    handleExportJSON,
    handleExportCSV,
    handleExportExcel,
    loadFailedLoginPhotos,
  };
};