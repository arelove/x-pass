/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
// SettingsPage/dialogs/PseudoModeDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import SmoothScrollContainer from '../../../components/SmoothScrollbar';

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

interface PseudoModeDialogProps {
  open: boolean;
  onClose: () => void;
  settings: PseudoModeSettings;
  onSave: (settings: PseudoModeSettings) => void;
  onDeletePassword?: (id: number) => void;
}

export const PseudoModeDialog: React.FC<PseudoModeDialogProps> = ({
  open,
  onClose,
  settings: initialSettings,
  onSave,
  onDeletePassword,
}) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PseudoModeSettings>(initialSettings);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSettings(initialSettings);
    }
  }, [open]);

  const handleAddPassword = () => {
    if (!newPassword) {
      setError(t('settings.pseudoMode.enterPassword'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('settings.pseudoMode.passwordsDoNotMatch'));
      return;
    }
    if (settings.passwords.some(p => p.password === newPassword)) {
      setError(t('settings.pseudoMode.passwordAlreadyExists'));
      return;
    }

    const newId = Math.max(0, ...settings.passwords.map(p => p.id)) + 1;
    setSettings({
      ...settings,
      passwords: [...settings.passwords, { id: newId, password: newPassword }]
    });
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleDeletePassword = (id: number) => {
    const pwd = settings.passwords.find(p => p.id === id);
    if (pwd && !pwd.password && onDeletePassword) {
      onDeletePassword(id);
    } else {
      setSettings({
        ...settings,
        passwords: settings.passwords.filter(p => p.id !== id)
      });
    }
  };

  const handleSave = () => {
    if (settings.enabled && settings.passwords.length === 0) {
      setError(t('settings.pseudoMode.atLeastOnePassword'));
      return;
    }
    
    const settingsToSave = {
      ...settings,
      hideActivityLogs: settings.hideActivityLogs ?? false,
      hideFailedLoginPhotos: settings.hideFailedLoginPhotos ?? false,
      hideSecuritySettings: settings.hideSecuritySettings ?? false,
      showFakeEntries: settings.showFakeEntries ?? false,
      hidePseudoModeCard: settings.hidePseudoModeCard ?? false,
    };
    
    onSave(settingsToSave);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon color="warning" />
          <Typography variant="h6" fontWeight={600}>
            {t('settings.pseudoMode.title')}
          </Typography>
        </Box>
      </DialogTitle>
      <SmoothScrollContainer
                      height="calc(100vh)" // Ð²Ñ‹Ñ‡Ð¸Ñ‚Ð°ÐµÐ¼ Ð²Ñ‹ÑÐ¾Ñ‚Ñƒ TitleBar
                    >
      <DialogContent sx={{ p: 3 }}>
        
        <Stack spacing={3}>
          <Alert severity="info" icon={<VisibilityOffIcon />}>
            {t('settings.pseudoMode.description')}
          </Alert>

          <Card variant="outlined">
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled ?? false}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {t('settings.pseudoMode.enablePseudoMode')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('settings.pseudoMode.enableDescription')}
                    </Typography>
                  </Box>
                }
              />
            </CardContent>
          </Card>

          {settings.enabled && (
            <>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {t('settings.pseudoMode.pseudoPasswords')}
                </Typography>
                <Typography variant="caption" color="text.secondary" paragraph>
                  {t('settings.pseudoMode.pseudoPasswordsDescription')}
                </Typography>

                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <TextField
                        label={t('settings.pseudoMode.newPassword')}
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError('');
                        }}
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label={t('settings.pseudoMode.confirmPassword')}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError('');
                        }}
                        size="small"
                        fullWidth
                      />
                      {error && (
                        <Alert severity="error" sx={{ py: 0.5 }}>
                          {error}
                        </Alert>
                      )}
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddPassword}
                       sx={{ color: 'text.primary' }}
                        size="small"
                      >
                        {t('settings.pseudoMode.addPassword')}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                {settings.passwords.length > 0 ? (
                  <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                    {settings.passwords.map((pwd, index) => (
                      <React.Fragment key={pwd.id}>
                        {index > 0 && <Divider />}
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2">
                                  {pwd.password ? 'â€¢'.repeat(pwd.password.length) : 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'}
                                </Typography>
                                <Chip 
                                  label={pwd.password 
                                    ? `${pwd.password.length} ${t('settings.pseudoMode.characters')}`
                                    : t('settings.pseudoMode.savedPassword')
                                  } 
                                  size="small" 
                                  variant="outlined"
                                />
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleDeletePassword(pwd.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Alert severity="warning">
                    {t('settings.pseudoMode.noPseudoPasswords')}
                  </Alert>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {t('settings.pseudoMode.hiddenFeatures')}
                </Typography>
                <Typography variant="caption" color="text.secondary" paragraph>
                  {t('settings.pseudoMode.hiddenFeaturesDescription')}
                </Typography>

                <Stack spacing={1.5}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.hideActivityLogs ?? false}
                        onChange={(e) => setSettings({ ...settings, hideActivityLogs: e.target.checked })}
                        size="small"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          {t('settings.pseudoMode.hideActivityLogs')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('settings.pseudoMode.hideActivityLogsDescription')}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.hideFailedLoginPhotos ?? false}
                        onChange={(e) => setSettings({ ...settings, hideFailedLoginPhotos: e.target.checked })}
                        size="small"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          {t('settings.pseudoMode.hideFailedLoginPhotos')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('settings.pseudoMode.hideFailedLoginPhotosDescription')}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.hideSecuritySettings ?? false}
                        onChange={(e) => setSettings({ ...settings, hideSecuritySettings: e.target.checked })}
                        size="small"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          {t('settings.pseudoMode.hideSecuritySettings')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('settings.pseudoMode.hideSecuritySettingsDescription')}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.hidePseudoModeCard ?? false}
                        onChange={(e) => setSettings({ ...settings, hidePseudoModeCard: e.target.checked })}
                        size="small"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          {t('settings.pseudoMode.hidePseudoModeCard')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('settings.pseudoMode.hidePseudoModeCardDescription')}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showFakeEntries ?? false}
                        onChange={(e) => setSettings({ ...settings, showFakeEntries: e.target.checked })}
                        size="small"
                        color="success"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          {t('settings.pseudoMode.showFakeEntries')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('settings.pseudoMode.showFakeEntriesDescription')}
                        </Typography>
                      </Box>
                    }
                  />
                </Stack>
              </Box>

              <Alert severity="warning">
                {t('settings.pseudoMode.warningMessage')}
              </Alert>
            </>
          )}

         {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button onClick={onClose} variant="outlined" sx={{ color: 'text.primary' }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} variant="contained" sx={{ color: 'text.primary' }}>
              {t('common.save')}
            </Button>
          </Box>
        </Stack>
        
      </DialogContent>
      </SmoothScrollContainer>
    </Dialog>
  );
};
