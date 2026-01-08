/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
// SettingsPage/dialogs/DeleteAccountDialog.tsx

import React from 'react';
import {
  Dialog,
  DialogContent,
  Stack,
  Typography,
  TextField,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DeleteAccountDialogProps {
  open: boolean;
  password: string;
  onClose: () => void;
  onPasswordChange: (password: string) => void;
  onConfirm: () => void;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  open,
  password,
  onClose,
  onPasswordChange,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={600}>
            {t('settings.deleteAccountTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('settings.deleteAccountConfirm')}
          </Typography>
          <TextField
            label={t('settings.masterPassword')}
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            fullWidth
            onKeyPress={(e) => e.key === 'Enter' && onConfirm()}
          />
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={onClose} sx={{color:'text.primary'}}>
              {t('settings.cancel')}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={onConfirm}
              disabled={!password}
            >
              {t('settings.delete')}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
