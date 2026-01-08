/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
// SettingsPage/dialogs/QRDialog.tsx

import React from 'react';
import { Dialog, DialogContent, useTheme } from '@mui/material';
import { QRCodeSVG as QRCode } from 'qrcode.react';

interface QRDialogProps {
  open: boolean;
  qrCodeUrl: string | null;
  onClose: () => void;
}

export const QRDialog: React.FC<QRDialogProps> = ({ open, qrCodeUrl, onClose }) => {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm">
      <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        {qrCodeUrl && (
          <QRCode
            value={qrCodeUrl}
            size={400}
            bgColor="#ffffff"
            fgColor={theme.palette.primary.main}
            level="M"
            includeMargin={true}
            style={{ borderRadius: 12 }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
