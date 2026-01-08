/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { usePseudoModeContext } from '../../../context/PseudoModeContext';

interface PseudoPassword {
  id: number;
  password: string;
}

interface PseudoModeSettings {
  enabled: boolean;
  passwords: PseudoPassword[];
  hideActivityLogs: boolean;
  hideFailedLoginPhotos: boolean;
  hideSecuritySettings: boolean;
  showFakeEntries: boolean;
  hidePseudoModeCard: boolean;
}

interface BackendPseudoModeSettings {
  enabled: boolean;
  passwords: Array<{ id: number; password: string }>;
  hide_activity_logs: boolean;
  hide_failed_login_photos: boolean;
  hide_security_settings: boolean;
  show_fake_entries: boolean;
  hide_pseudo_mode_card: boolean;
}

export const usePseudoMode = (userId: number | null) => {
  const { t } = useTranslation();
  const [openDialog, setOpenDialog] = useState(false);
  const [settings, setSettings] = useState<PseudoModeSettings>({
    enabled: false,
    passwords: [],
    hideActivityLogs: false,
    hideFailedLoginPhotos: false,
    hideSecuritySettings: false,
    showFakeEntries: false,
    hidePseudoModeCard: false,
  });

  const { checkPseudoMode } = usePseudoModeContext();

  const loadSettings = async () => {
    if (!userId) return;

    try {
      const loadedSettings = await invoke<BackendPseudoModeSettings>('get_pseudo_mode_settings', {
        userId,
      });
      
      const formattedSettings: PseudoModeSettings = {
        enabled: loadedSettings.enabled,
        hideActivityLogs: loadedSettings.hide_activity_logs,
        hideFailedLoginPhotos: loadedSettings.hide_failed_login_photos,
        hideSecuritySettings: loadedSettings.hide_security_settings,
        showFakeEntries: loadedSettings.show_fake_entries,
        hidePseudoModeCard: loadedSettings.hide_pseudo_mode_card,
        passwords: loadedSettings.passwords.map((p) => ({
          id: p.id,
          password: '',
        }))
      };
      
      setSettings(formattedSettings);
      await checkPseudoMode();
    } catch (error) {
      console.error('Failed to load pseudo mode settings:', error);
      setSettings({
        enabled: false,
        passwords: [],
        hideActivityLogs: false,
        hideFailedLoginPhotos: false,
        hideSecuritySettings: false,
        showFakeEntries: false,
        hidePseudoModeCard: false,
      });
    }
  };

  const deletePseudoPassword = async (pseudoId: number) => {
    if (!userId) return;

    try {
      await invoke('delete_pseudo_password', {
        userId,
        pseudoId,
      });
      await loadSettings();
    } catch (error) {
      console.error('Failed to delete pseudo password:', error);
      alert(t('settings.pseudoMode.deletePasswordError') + ': ' + error);
    }
  };

  const saveSettings = async (newSettings: PseudoModeSettings) => {
    if (!userId) return;

    try {
      await invoke('delete_all_pseudo_passwords', { userId });

      for (const pwd of newSettings.passwords) {
        if (pwd.password && pwd.password.trim() !== '') {
          await invoke('add_pseudo_password', {
            userId,
            password: pwd.password,
          });
        }
      }

      await invoke('save_pseudo_mode_settings', {
        userId,
        enabled: newSettings.enabled,
        hideActivityLogs: newSettings.hideActivityLogs,
        hideFailedLoginPhotos: newSettings.hideFailedLoginPhotos,
        hideSecuritySettings: newSettings.hideSecuritySettings,
        showFakeEntries: newSettings.showFakeEntries,
        hidePseudoModeCard: newSettings.hidePseudoModeCard,
      });
      
      await loadSettings();
      alert(t('settings.pseudoMode.settingsSavedSuccessfully'));
    } catch (error) {
      console.error('Failed to save pseudo mode settings:', error);
      alert(t('settings.pseudoMode.saveError') + ': ' + error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadSettings();
    }
  }, [userId]);

  return {
    openDialog,
    setOpenDialog,
    settings,
    saveSettings,
    loadSettings,
    deletePseudoPassword,
  };
};