/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
// SettingsPage/dialogs/PhotosDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Stack,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Checkbox,
  Grid,
  Chip,
  Badge,
  Zoom,
  Fade,
  Paper,
  Divider,
  Alert,
  FormControlLabel,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import TodayIcon from '@mui/icons-material/Today';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useTranslation } from 'react-i18next';
import { FailedLoginPhoto } from '../../types';
import SmoothScrollContainer from '../../../../components/SmoothScrollbar';
import { EnhancedPhotoViewer } from './EnhancedPhotoViewer';

interface PhotosDialogProps {
  open: boolean;
  onClose: () => void;
  filteredPhotos: FailedLoginPhoto[];
  selectedPhotos: number[];
  searchQuery: string;
  dateFilter: 'all' | 'today' | 'week' | 'month';
  sortBy: 'date' | 'username';
  onSearchQueryChange: (query: string) => void;
  onDateFilterChange: (filter: 'all' | 'today' | 'week' | 'month') => void;
  onSortByChange: (sortBy: 'date' | 'username') => void;
  onToggleSelectPhoto: (photoId: number) => void;
  onSelectAll: () => void;
  onViewPhoto: (photoPath: string) => void;
  onDeletePhoto: (photoId: number) => void;
  onBulkDelete: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onRefresh: () => void;
  selectedPhoto: string | null;
  onClosePhotoViewer: () => void;
}

export const PhotosDialog: React.FC<PhotosDialogProps> = ({
  open,
  onClose,
  filteredPhotos,
  selectedPhotos,
  searchQuery,
  dateFilter,
  sortBy,
  onSearchQueryChange,
  onDateFilterChange,
  onSortByChange,
  onToggleSelectPhoto,
  onSelectAll,
  onViewPhoto,
  onDeletePhoto,
  onBulkDelete,
  onExportJSON,
  onExportCSV,
  onExportExcel,
  onRefresh,
  selectedPhoto,
  onClosePhotoViewer,
}) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(true);
  const [zoom, setZoom] = useState(1);

  const handleNavigatePhoto = (direction: 'prev' | 'next') => {
    const currentIndex = filteredPhotos.findIndex(p => p.photo_data === selectedPhoto);
    if (currentIndex === -1) return;

    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = filteredPhotos.length - 1;
    if (newIndex >= filteredPhotos.length) newIndex = 0;

    onViewPhoto(filteredPhotos[newIndex].photo_data);
    setZoom(1);
  };

  const handleDownloadPhoto = (photoData: string, filename: string) => {
    const link = document.createElement('a');
    link.href = photoData;
    link.download = filename;
    link.click();
  };

  const stats = {
    total: filteredPhotos.length,
    selected: selectedPhotos.length,
    uniqueUsers: new Set(filteredPhotos.map(p => p.username_attempt)).size,
    todayCount: filteredPhotos.filter(p => {
      const today = new Date();
      const photoDate = new Date(p.timestamp);
      return photoDate.toDateString() === today.toDateString();
    }).length,
  };

  return (
    <>
      {/* Failed Login Photos Dialog */}
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="xl" 
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Header with Stats and Actions */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                {/* Left: Title and Stats */}
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="h5" fontWeight={700}>
                    {t('settings.failedLoginPhotos')}
                  </Typography>
                  
                  <Chip 
                    icon={<PhotoLibraryIcon />}
                    label={`${stats.total}`} 
                    size="small" 
                    color="primary" 
                    variant="filled"
                  />

                  <Chip 
                    icon={<TodayIcon />}
                    label={`${stats.todayCount} ${t('settings.today')}`} 
                    size="small" 
                    color="error" 
                    variant="outlined"
                  />
                  
                  {selectedPhotos.length > 0 && (
                    <Chip 
                      icon={<CheckBoxIcon />}
                      label={`${stats.selected} ${t('settings.selected')}`} 
                      size="small" 
                      color="success" 
                      variant="filled"
                      onDelete={selectedPhotos.length > 0 ? onBulkDelete : undefined}
                      deleteIcon={<DeleteIcon />}
                    />
                  )}
                </Box>

                {/* Right: Actions */}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {filteredPhotos.length > 0 && (
                     <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedPhotos.length === filteredPhotos.length}
                          indeterminate={selectedPhotos.length > 0 && selectedPhotos.length < filteredPhotos.length}
                          onChange={onSelectAll}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight={selectedPhotos.length > 0 ? 600 : 400}>
                          {selectedPhotos.length > 0 
                            ? t('settings.selectedPhotos', { count: selectedPhotos.length })
                            : t('settings.selectAll')}
                        </Typography>
                      }
                    />
                  )}
                  
                  <Tooltip title={t('settings.toggleFilters')}>
                    <IconButton 
                      onClick={() => setShowFilters(!showFilters)} 
                      size="small"
                      color={showFilters ? 'primary' : 'default'}
                    >
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('settings.exportJSON')}>
                    <IconButton onClick={onExportJSON} size="small">
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('settings.exportCSV')}>
                    <IconButton onClick={onExportCSV} size="small">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('settings.exportExcel')}>
                    <IconButton onClick={onExportExcel} size="small" color="primary">
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('settings.refresh')}>
                    <IconButton onClick={onRefresh} size="small">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.close')}>
                    <IconButton onClick={onClose} size="small">
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />
            </Box>

            {/* Filters - Collapsible */}
            <Fade in={showFilters}>
              <Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                  <TextField
                    placeholder={t('settings.searchByUsername')}
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                  
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>{t('settings.dateFilter')}</InputLabel>
                    <Select
                      value={dateFilter}
                      label={t('settings.dateFilter')}
                      onChange={(e) => onDateFilterChange(e.target.value as any)}
                    >
                      <MenuItem value="all">{t('settings.allTime')}</MenuItem>
                      <MenuItem value="today">{t('settings.today')}</MenuItem>
                      <MenuItem value="week">{t('settings.thisWeek')}</MenuItem>
                      <MenuItem value="month">{t('settings.thisMonth')}</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>{t('settings.sortBy')}</InputLabel>
                    <Select
                      value={sortBy}
                      label={t('settings.sortBy')}
                      onChange={(e) => onSortByChange(e.target.value as any)}
                    >
                      <MenuItem value="date">{t('settings.date')}</MenuItem>
                      <MenuItem value="username">{t('settings.username')}</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                <Divider sx={{ my: 2 }} />
              </Box>
            </Fade>

            {/* Active Filters Info */}
            {(searchQuery || dateFilter !== 'all') && (
              <Alert 
                severity="info" 
                icon={<InfoOutlinedIcon />}
                sx={{ py: 0.5 }}
              >
                {t('settings.activeFilters')}: 
                {searchQuery && <Chip label={`${t('settings.search')}: "${searchQuery}"`} size="small" sx={{ ml: 1 }} />}
                {dateFilter !== 'all' && <Chip label={`${t('settings.period')}: ${t(`settings.${dateFilter}`)}`} size="small" sx={{ ml: 1 }} />}
              </Alert>
            )}

            {/* Photo Grid */}
            <SmoothScrollContainer height="60vh">
              <Grid container spacing={2}>
                {filteredPhotos.map((photo, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={photo.id}>
                    <Zoom in style={{ transitionDelay: `${index * 30}ms` }}>
                      <Card 
                        sx={{ 
                          position: 'relative', 
                          border: 2,
                          borderColor: selectedPhotos.includes(photo.id) ? 'primary.main' : 'transparent',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6,
                          }
                        }}
                      >
                        <Badge
                          badgeContent={
                            <Checkbox
                              checked={selectedPhotos.includes(photo.id)}
                              onChange={() => onToggleSelectPhoto(photo.id)}
                              size="small"
                              sx={{ p: 0 }}
                            />
                          }
                          sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            left: 8, 
                            zIndex: 2,
                            '& .MuiBadge-badge': {
                              bgcolor: 'background.paper',
                              borderRadius: 1,
                              p: 0.5,
                            }
                          }}
                        />
                        
                        <Box
                          component="img"
                          src={photo.photo_data}
                          alt="Failed login"
                          sx={{ 
                            width: '100%', 
                            height: 200, 
                            objectFit: 'cover', 
                            cursor: 'pointer',
                            bgcolor: 'grey.200',
                            transition: 'transform 0.3s',
                            '&:hover': {
                              transform: 'scale(1.05)',
                            }
                          }}
                          onClick={() => {
                            onViewPhoto(photo.photo_data);
                          }}
                          onError={(e) => {
                            console.error('Image load error');
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                          }}
                        />
                        
                        <CardContent sx={{ py: 1.5, px: 2 }}>
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                              📅 {new Date(photo.timestamp).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                              🕐 {new Date(photo.timestamp).toLocaleTimeString()}
                            </Typography>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography variant="body2" fontWeight={600} noWrap>
                              👤 {photo.username_attempt}
                            </Typography>
                          </Stack>
                        </CardContent>
                        
                        <IconButton
                          sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            right: 8, 
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'error.dark',
                            }
                          }}
                          size="small"
                          onClick={() => onDeletePhoto(photo.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Card>
                    </Zoom>
                  </Grid>
                ))}
                
                {filteredPhotos.length === 0 && (
                <Grid size={{ xs: 12 }}>
                  <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'action.hover' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      🔍 {searchQuery || dateFilter !== 'all' 
                        ? t('settings.noPhotosFound') 
                        : t('settings.noFailedLoginPhotos')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery || dateFilter !== 'all'
                        ? t('settings.tryAdjustingFilters')
                        : t('settings.photosWillAppearHere')}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              </Grid>
            </SmoothScrollContainer>
          </Stack>
        </DialogContent>
      </Dialog>

       {/* Enhanced Photo Viewer */}
      <EnhancedPhotoViewer
        open={!!selectedPhoto}
        selectedPhoto={selectedPhoto}
        filteredPhotos={filteredPhotos}
        zoom={zoom}
        onClose={onClosePhotoViewer}
        onZoomChange={setZoom}
        onNavigate={handleNavigatePhoto}
        onDownload={handleDownloadPhoto}
      />
    </>
  );
};
