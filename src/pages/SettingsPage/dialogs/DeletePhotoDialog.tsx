/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
// SettingsPage/dialogs/DeletePhotoDialog.tsx

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

interface DeletePhotoDialogProps {
  open: boolean;
  password: string;
  isMultiple: boolean;
  count: number;
  onClose: () => void;
  onPasswordChange: (password: string) => void;
  onConfirm: () => void;
}

export const DeletePhotoDialog: React.FC<DeletePhotoDialogProps> = ({
  open,
  password,
  isMultiple,
  count,
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
            {isMultiple 
              ? t('settings.confirmDeletePhotos', { count })
              : t('settings.confirmDeletePhoto')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('settings.photoDeleteWarning')}
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
