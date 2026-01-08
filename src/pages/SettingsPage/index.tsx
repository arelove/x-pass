/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

// SettingsPage/index.tsx
import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';

// Context
import { AuthContext } from '../../context/AuthContext';
import { usePseudoModeContext } from '../../context/PseudoModeContext';

// Hooks
import { useSettings } from './hooks/useSettings';
import { useActivityLogs } from './hooks/useActivityLogs';
import { usePhotos } from './hooks/usePhotos';
import { usePseudoMode } from './hooks/usePseudoMode';

// Components
import { ProfileSection } from './components/ProfileSection';
import { LanguageThemeSection } from './components/LanguageThemeSection';
import { ActivityLogSection } from './components/ActivityLogSection';

// Dialogs
import { DeleteAccountDialog } from './dialogs/DeleteAccountDialog';
import { QRDialog } from './dialogs/QRDialog';
import { ActivityDialogs } from './dialogs/ActivityDialogs';
import { PhotosDialog } from './dialogs/PhotosDialog/PhotosDialog';
import { DeletePhotoDialog } from './dialogs/DeletePhotoDialog';
import { PseudoModeDialog } from './dialogs/PseudoModeDialog';
import { SecuritySection } from './components/SecuritySection';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { auth } = useContext(AuthContext);
  const userId = auth?.user_id || null;
  const { isPseudoMode, checkPseudoMode } = usePseudoModeContext();
  const settings = useSettings();
  const activityLogs = useActivityLogs();
  const photos = usePhotos();
  const pseudoMode = usePseudoMode(userId);
  const shouldHideActivityLogs = isPseudoMode && (pseudoMode.settings.hideActivityLogs ?? false);
  const shouldHidePhotos = isPseudoMode && (pseudoMode.settings.hideFailedLoginPhotos ?? false);
  const shouldHidePseudoModeCard = isPseudoMode && (pseudoMode.settings.hidePseudoModeCard ?? false);

  const handleSavePseudoMode = async (newSettings: any) => {
    await pseudoMode.saveSettings(newSettings);
    await checkPseudoMode();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto', bgcolor: 'transparent', overflow: 'hidden' }}>
      {/* Hidden inputs */}
      <input
        type="color"
        ref={settings.colorInputRef}
        onChange={settings.handleColorChange}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
      <input
        type="file"
        ref={settings.profilePicInputRef}
        onChange={settings.handleProfilePicChange}
        accept="image/*"
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
          {t('settings')}
        </Typography>
      </motion.div>

      <Grid container spacing={3}>
        {/* Profile & OTP Section */}
        <ProfileSection
          profilePics={settings.profilePics}
          profilePicInputRef={settings.profilePicInputRef}
          qrCodeUrl={settings.qrCodeUrl}
          hasOtp={settings.hasOtp}
          onGenerateOTP={settings.handleGenerateOTP}
          onOpenQrDialog={() => settings.setOpenQrDialog(true)}
        />

        {/* Language & Theme Section */}
        <LanguageThemeSection
          themeName={settings.themeName}
          themeError={settings.themeError}
          colorFields={settings.colorFields}
          onThemeNameChange={(name) => {
            settings.setThemeName(name);
            settings.setThemeError('');
          }}
          onColorClick={settings.handleColorClick}
          onSaveTheme={settings.handleSaveTheme}
          onDeleteTheme={settings.handleDeleteTheme}
          photoSetting={photos.photoSetting}
          onPhotoSettingChange={photos.handlePhotoSettingChange}
        />

        {/* Security & Pseudo Mode Section */}
        {!shouldHidePseudoModeCard && (
          <SecuritySection
            photoSetting={photos.photoSetting}
            onPhotoSettingChange={photos.handlePhotoSettingChange}
            pseudoModeEnabled={pseudoMode.settings.enabled}
            pseudoPasswordsCount={pseudoMode.settings.passwords.length}
            onOpenPseudoModeDialog={() => pseudoMode.setOpenDialog(true)}
          />
        )}

        {/* Activity Log Section */}
        {!shouldHideActivityLogs && (
          <ActivityLogSection
            activityLogs={activityLogs.activityLogs}
            totalLogsCount={activityLogs.totalLogsCount}
            onRefresh={activityLogs.loadActivityLogs}
            onOpenStats={() => activityLogs.setOpenStatsDialog(true)}
            onClearLogs={activityLogs.handleClearLogs}
            onViewAll={() => activityLogs.setOpenActivityDialog(true)}
          />
        )}

        {/* Delete Account Button */}
        <Grid size={{ xs: 12 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => settings.setOpenDeleteDialog(true)}
                sx={{ borderRadius: 2, px: 4 }}
              >
                {t('settings.deleteAccount')}
              </Button>
            </Box>
          </motion.div>
        </Grid>
      </Grid>

      {/* All Dialogs */}
      <DeleteAccountDialog
        open={settings.openDeleteDialog}
        password={settings.deletePassword}
        onClose={() => settings.setOpenDeleteDialog(false)}
        onPasswordChange={settings.setDeletePassword}
        onConfirm={settings.handleDeleteAccount}
      />

      <QRDialog
        open={settings.openQrDialog}
        qrCodeUrl={settings.qrCodeUrl}
        onClose={() => settings.setOpenQrDialog(false)}
      />

      {/* Activity Dialogs */}
      {!shouldHideActivityLogs && (
        <ActivityDialogs
          openActivityDialog={activityLogs.openActivityDialog}
          onCloseActivityDialog={() => activityLogs.setOpenActivityDialog(false)}
          paginatedLogs={activityLogs.allActivityLogs}
          totalLogs={activityLogs.totalLogsCount}
          page={0}
          rowsPerPage={10}
          onChangePage={() => {}}
          onChangeRowsPerPage={() => {}}
          openStatsDialog={activityLogs.openStatsDialog}
          onCloseStatsDialog={() => activityLogs.setOpenStatsDialog(false)}
          activityStats={activityLogs.activityStats}
          activityTrend={activityLogs.activityTrend}
          trendDays={activityLogs.trendDays}
          onTrendDaysChange={activityLogs.setTrendDays}
          onOpenChart={activityLogs.handleOpenChart}
          onExportLogs={activityLogs.handleExportLogs}
          onClearLogs={activityLogs.handleClearLogs}
          onOpenPhotosDialog={() => {
            if (!shouldHidePhotos) {
              photos.loadFailedLoginPhotos();
              photos.setOpenPhotosDialog(true);
            }
          }}
          openChartDialog={activityLogs.openChartDialog}
          onCloseChartDialog={() => activityLogs.setOpenChartDialog(false)}
          selectedChart={activityLogs.selectedChart}
          openDeleteLogsDialog={activityLogs.openDeleteLogsDialog}
          onCloseDeleteLogsDialog={() => activityLogs.setOpenDeleteLogsDialog(false)}
          deleteDialogPassword={activityLogs.deleteDialogPassword}
          onDeleteDialogPasswordChange={activityLogs.setDeleteDialogPassword}
          onScheduleLogsDeletion={activityLogs.handleScheduleLogsDeletion}
        />
      )}

      {/* Photos Dialog */}
      {!shouldHidePhotos && (
        <>
          <PhotosDialog
            open={photos.openPhotosDialog}
            onClose={() => photos.setOpenPhotosDialog(false)}
            filteredPhotos={photos.filteredPhotos}
            selectedPhotos={photos.selectedPhotos}
            searchQuery={photos.searchQuery}
            dateFilter={photos.dateFilter}
            sortBy={photos.sortBy}
            onSearchQueryChange={photos.setSearchQuery}
            onDateFilterChange={photos.setDateFilter}
            onSortByChange={photos.setSortBy}
            onToggleSelectPhoto={photos.handleToggleSelectPhoto}
            onSelectAll={photos.handleSelectAll}
            onViewPhoto={photos.handleViewPhoto}
            onDeletePhoto={photos.handleDeletePhotoClick}
            onBulkDelete={() => photos.setOpenDeletePhotoDialog(true)}
            onExportJSON={photos.handleExportJSON}
            onExportCSV={photos.handleExportCSV}
            onExportExcel={photos.handleExportExcel}
            onRefresh={photos.loadFailedLoginPhotos}
            selectedPhoto={photos.selectedPhoto}
            onClosePhotoViewer={() => photos.setSelectedPhoto(null)}
          />
          <DeletePhotoDialog
            open={photos.openDeletePhotoDialog}
            onClose={() => {
              photos.setOpenDeletePhotoDialog(false);
              photos.setDeletePhotoPassword('');
            }}
            password={photos.deletePhotoPassword}
            onPasswordChange={photos.setDeletePhotoPassword}
            onConfirm={photos.handleConfirmDelete}
            isMultiple={photos.photoToDelete === null && photos.selectedPhotos.length > 0}
            count={photos.selectedPhotos.length}
          />
        </>
      )}

      {/* Pseudo Mode Dialog */}
      <PseudoModeDialog
        open={pseudoMode.openDialog}
        onClose={() => pseudoMode.setOpenDialog(false)}
        settings={pseudoMode.settings}
        onSave={handleSavePseudoMode}
        onDeletePassword={pseudoMode.deletePseudoPassword}
      />
    </Box>
  );
};

export default Settings;