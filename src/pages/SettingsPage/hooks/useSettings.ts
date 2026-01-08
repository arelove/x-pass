/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
// SettingsPage/hooks/useSettings.ts

import { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { ThemeContext } from '../../../context/theme/ThemeContext';
import { AuthContext } from '../../../context/AuthContext';
import { SnackbarContext } from '../../../components/SnackbarProvider';

export const useSettings = () => {
  const { t, i18n } = useTranslation();
  const { customTheme, updateCustomTheme, customThemes, saveCustomTheme, deleteCustomTheme } = useContext(ThemeContext);
  const { auth, setAuth } = useContext(AuthContext);
  const { showMessage } = useContext(SnackbarContext)!;

  const colorInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const currentFieldRef = useRef<keyof typeof customTheme | null>(null);

  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [themeName, setThemeName] = useState('');
  const [themeError, setThemeError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [hasOtp, setHasOtp] = useState<boolean>(false);
  const [openQrDialog, setOpenQrDialog] = useState(false);

  useEffect(() => {
    localStorage.setItem('language', i18n.language);
    const storedPics = localStorage.getItem('profilePics');
    if (storedPics) {
      setProfilePics(JSON.parse(storedPics));
    }

    const checkOtpSecret = async () => {
      if (auth) {
        try {
          const hasSecret = await invoke<boolean>('has_otp_secret', { username: auth.username });
          setHasOtp(hasSecret);
          if (hasSecret) {
            const [_, qrUrl] = await invoke<[string, string]>('generate_otp_secret', { username: auth.username });
            setQrCodeUrl(qrUrl);
          }
        } catch (err) {
          console.error('Failed to check OTP secret:', err);
        }
      }
    };

    const checkDeletion = async () => {
      if (auth) {
        try {
          const wasDeleted = await invoke<boolean>('check_pending_deletion', { userId: auth.user_id });
          if (wasDeleted) {
            showMessage(t('settings.logsWereDeleted'), 'warning');
          }
        } catch (err) {
          console.error('Failed to check pending deletion:', err);
        }
      }
    };

    checkDeletion();
    checkOtpSecret();
  }, [auth, t]);

  const handleColorClick = (field: string) => () => {
    currentFieldRef.current = field as keyof typeof customTheme;
    if (colorInputRef.current) {
      colorInputRef.current.value = customTheme[field as keyof typeof customTheme];
      colorInputRef.current.click();
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentFieldRef.current) {
      updateCustomTheme({ [currentFieldRef.current]: e.target.value });
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && auth) {
      if (!file.type.startsWith('image/')) {
        showMessage(t('settings.invalidImage'), 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const storedPics = JSON.parse(localStorage.getItem('profilePics') || '{}');
        storedPics[auth.username] = base64;
        localStorage.setItem('profilePics', JSON.stringify(storedPics));
        setProfilePics({ ...storedPics });
      };
      reader.onerror = () => showMessage(t('settings.imageLoadFailed'), 'error');
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTheme = () => {
    if (!themeName.trim()) {
      setThemeError(t('settings.themeNameRequired'));
      return;
    }
    if (customThemes.some((theme) => theme.name === themeName)) {
      setThemeError(t('settings.themeNameExists'));
      return;
    }
    saveCustomTheme(themeName);
    setThemeName('');
    setThemeError('');
    showMessage(t('settings.themeSaved'), 'success');
  };

  const handleDeleteTheme = (name: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomTheme(name);
    showMessage(t('settings.themeDeleted'), 'success');
  };

  const handleDeleteAccount = async () => {
    if (auth) {
      try {
        await invoke('delete_user', { userId: auth.user_id, masterPass: deletePassword });
        setAuth(null);
        showMessage(t('settings.deleteAccountSuccess'), 'success');
      } catch (err) {
        showMessage(`${t('settings.deleteAccountFailed')}: ${err}`, 'error');
      }
      setOpenDeleteDialog(false);
      setDeletePassword('');
    }
  };

  const handleGenerateOTP = async () => {
    if (auth) {
      try {
        const [qrUrl] = await invoke<[string, string]>('generate_otp_secret', { username: auth.username });
        setQrCodeUrl(qrUrl);
        setHasOtp(true);
        showMessage(t('settings.otpGenerated'), 'success');
      } catch (err) {
        showMessage(`${t('settings.otpGenerationFailed')}: ${err}`, 'error');
      }
    }
  };

  const colorFields = [
    { label: t('customTheme.primary'), field: 'primary', value: customTheme.primary },
    { label: t('customTheme.backgroundDefault'), field: 'backgroundDefault', value: customTheme.backgroundDefault },
    { label: t('customTheme.backgroundPaper'), field: 'backgroundPaper', value: customTheme.backgroundPaper },
    { label: t('customTheme.textPrimary'), field: 'textPrimary', value: customTheme.textPrimary },
    { label: t('customTheme.textSecondary'), field: 'textSecondary', value: customTheme.textSecondary },
  ];

  return {
    colorInputRef,
    profilePicInputRef,
    profilePics,
    themeName,
    setThemeName,
    themeError,
    setThemeError,
    openDeleteDialog,
    setOpenDeleteDialog,
    deletePassword,
    setDeletePassword,
    qrCodeUrl,
    hasOtp,
    openQrDialog,
    setOpenQrDialog,
    colorFields,
    handleColorClick,
    handleColorChange,
    handleProfilePicChange,
    handleSaveTheme,
    handleDeleteTheme,
    handleDeleteAccount,
    handleGenerateOTP,
  };
};
