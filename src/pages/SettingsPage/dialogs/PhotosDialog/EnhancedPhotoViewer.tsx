/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
// SettingsPage/dialogs/PhotosDialog/EnhancedPhotoViewer.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { useTranslation } from 'react-i18next';
import { FailedLoginPhoto } from '../../types';

interface EnhancedPhotoViewerProps {
  open: boolean;
  selectedPhoto: string | null;
  filteredPhotos: FailedLoginPhoto[];
  zoom: number;
  onClose: () => void;
  onZoomChange: (zoom: number) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onDownload: (photoData: string, filename: string) => void;
}

export const EnhancedPhotoViewer: React.FC<EnhancedPhotoViewerProps> = ({
  open,
  selectedPhoto,
  filteredPhotos,
  zoom,
  onClose,
  onZoomChange,
  onNavigate,
  onDownload,
}) => {
  const { t } = useTranslation();
  const currentPhoto = filteredPhotos.find(p => p.photo_data === selectedPhoto);
  const currentPhotoIndexInFiltered = filteredPhotos.findIndex(p => p.photo_data === selectedPhoto);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          backgroundImage: 'none',
        }
      }}
    >
      {/* Navigation Header */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 2,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          p: 2,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            <Tooltip title={t('settings.previousPhoto')}>
              <IconButton 
                onClick={() => onNavigate('prev')} 
                sx={{ color: 'white' }}
                disabled={filteredPhotos.length <= 1}
              >
                <NavigateBeforeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('settings.nextPhoto')}>
              <IconButton 
                onClick={() => onNavigate('next')} 
                sx={{ color: 'white' }}
                disabled={filteredPhotos.length <= 1}
              >
                <NavigateNextIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'white', mx: 1 }} />
            <Typography variant="body2" sx={{ color: 'white', display: 'flex', alignItems: 'center' }}>
              {currentPhotoIndexInFiltered + 1} / {filteredPhotos.length}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title={t('settings.zoomOut')}>
              <IconButton 
                onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))} 
                sx={{ color: 'white' }}
              >
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ color: 'white', display: 'flex', alignItems: 'center', minWidth: 60, justifyContent: 'center' }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <Tooltip title={t('settings.zoomIn')}>
              <IconButton 
                onClick={() => onZoomChange(Math.min(3, zoom + 0.25))} 
                sx={{ color: 'white' }}
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('settings.resetZoom')}>
              <IconButton 
                onClick={() => onZoomChange(1)} 
                sx={{ color: 'white' }}
              >
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'white', mx: 1 }} />
            <Tooltip title={t('settings.download')}>
              <IconButton 
                onClick={() => currentPhoto && onDownload(
                  currentPhoto.photo_data, 
                  `failed_login_${currentPhoto.username_attempt}_${new Date(currentPhoto.timestamp).toISOString()}.jpg`
                )} 
                sx={{ color: 'white' }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.close')}>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Image Content */}
      <DialogContent 
        sx={{ 
          p: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '70vh',
          overflow: 'auto',
          mt: 8,
        }}
      >
        {selectedPhoto && (
          <Box
            component="img"
            src={selectedPhoto}
            alt="Failed login"
            sx={{ 
              maxWidth: '100%', 
              maxHeight: '80vh', 
              transform: `scale(${zoom})`,
              transition: 'transform 0.3s',
              cursor: zoom > 1 ? 'move' : 'default',
            }}
          />
        )}
      </DialogContent>

      {/* Photo Info Footer */}
      {currentPhoto && (
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 2,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            p: 2,
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
              ðŸ‘¤ {t('settings.username')}: {currentPhoto.username_attempt}
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.400' }}>
              ðŸ“… {new Date(currentPhoto.timestamp).toLocaleString()}
            </Typography>
          </Stack>
        </Box>
      )}
    </Dialog>
  );
};
