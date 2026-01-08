/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

// SettingsPage/components/ProfileSection.tsx

import React, { useContext, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Avatar,
  IconButton,
  Box,
  Button,
  alpha,
  useTheme,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../../context/AuthContext';
import { invoke } from '@tauri-apps/api/core';
import { SnackbarContext } from '../../../components/SnackbarProvider';
import SettingsIcon from "@mui/icons-material/Settings"

interface ProfileSectionProps {
  profilePics: Record<string, string>;
  profilePicInputRef: React.RefObject<HTMLInputElement | null>;
  qrCodeUrl: string | null;
  hasOtp: boolean;
  onGenerateOTP: () => void;
  onOpenQrDialog: () => void;
}

// Мемоизированный компонент QR кода
const MemoizedQRCode = memo(({ value, size, theme }: { value: string; size: number; theme: any }) => (
  <QRCode
    value={value}
    size={size}
    bgColor="#ffffff"
    fgColor={theme.palette.primary.main}
    level="M"
    includeMargin={false}
    style={{ borderRadius: 6, display: 'block' }}
  />
));

MemoizedQRCode.displayName = 'MemoizedQRCode';

export const ProfileSection: React.FC<ProfileSectionProps> = memo(({
  profilePics,
  profilePicInputRef,
  qrCodeUrl,
  hasOtp,
  onGenerateOTP,
  onOpenQrDialog,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { auth } = useContext(AuthContext);
  const { showMessage } = useContext(SnackbarContext)!;
  
  const [hasRecovery, setHasRecovery] = useState(false);
  const [openSetupDialog, setOpenSetupDialog] = useState(false);
  const [openViewQrDialog, setOpenViewQrDialog] = useState(false);
  const [viewQrPassword, setViewQrPassword] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [masterPassword, setMasterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string | null>(null);
  const [otpSecret, setOtpSecret] = useState<string>('');

  const steps = useMemo(() => [
    t('settings.enterPassword'), 
    t('settings.scanQRCode'), 
    t('settings.complete')
  ], [t]);

  // Проверяем статус OTP и Recovery при загрузке
  useEffect(() => {
    if (auth?.username && hasOtp) {
      checkRecoveryStatus();
    }
  }, [auth?.username, hasOtp]);

  const checkRecoveryStatus = useCallback(async () => {
    if (!auth?.username) return;
    
    try {
      const status = await invoke<boolean>('has_otp_recovery', { 
        username: auth.username 
      });
      setHasRecovery(status);
    } catch (err) {
      console.error('Failed to check recovery status:', err);
      setHasRecovery(false);
    }
  }, [auth?.username]);

  const handleOpenSetupDialog = useCallback(() => {
    setOpenSetupDialog(true);
    setActiveStep(0);
    setMasterPassword('');
    setGeneratedQrUrl(null);
    setOtpSecret('');
  }, []);

  const handleCloseSetupDialog = useCallback(() => {
    setOpenSetupDialog(false);
    setActiveStep(0);
    setMasterPassword('');
    setGeneratedQrUrl(null);
    setOtpSecret('');
  }, []);

  const handleOpenViewQrDialog = useCallback(() => {
    setOpenViewQrDialog(true);
    setViewQrPassword('');
  }, []);

  const handleCloseViewQrDialog = useCallback(() => {
    setOpenViewQrDialog(false);
    setViewQrPassword('');
  }, []);

  const handleVerifyPasswordAndShowQr = useCallback(async () => {
    if (!viewQrPassword) {
      showMessage(t('settings.enterMasterPassword'), 'warning');
      return;
    }

    if (!auth?.user_id) {
      showMessage(t('settings.userNotFound'), 'error');
      return;
    }

    setVerifyingPassword(true);
    try {
      await invoke('verify_user_password', {
        userId: auth.user_id,
        password: viewQrPassword,
      });
      
      handleCloseViewQrDialog();
      onOpenQrDialog();
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || String(err);
      
      showMessage(
        errorMessage.includes('Invalid password') 
          ? t('settings.invalidPassword') 
          : t('settings.verificationFailed'), 
        'error'
      );
    } finally {
      setVerifyingPassword(false);
    }
  }, [viewQrPassword, auth?.user_id, showMessage, t, handleCloseViewQrDialog, onOpenQrDialog]);

  const handleGenerateQRWithRecovery = useCallback(async () => {
    if (!masterPassword) {
      showMessage(t('settings.enterMasterPassword'), 'warning');
      return;
    }

    if (!auth?.user_id || !auth?.username) {
      showMessage(t('settings.userNotFound'), 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await invoke<{ qr_code: string; secret: string }>('generate_otp_secret', {
        userId: auth.user_id,
        username: auth.username,
      });
      
      setGeneratedQrUrl(result.qr_code);
      setOtpSecret(result.secret);

      await invoke('setup_otp_recovery', {
        userId: auth.user_id,
        masterPass: masterPassword,
      });
      
      setHasRecovery(true);
      setActiveStep(1);
      showMessage(t('settings.qrCodeGenerated'), 'success');
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || String(err);
      
      showMessage(
        errorMessage.includes('Invalid password') 
          ? t('settings.invalidPassword') 
          : t('settings.failedToGenerateOTP'), 
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [masterPassword, auth?.user_id, auth?.username, showMessage, t]);

  const handleComplete = useCallback(() => {
    setActiveStep(2);
    showMessage(t('settings.otpSetupComplete'), 'success');
    onGenerateOTP();
    
    setTimeout(handleCloseSetupDialog, 2000);
  }, [showMessage, t, onGenerateOTP, handleCloseSetupDialog]);

  const handleCopySecret = useCallback(() => {
    if (otpSecret) {
      navigator.clipboard.writeText(otpSecret);
      showMessage(t('settings.secretCopied'), 'success');
    }
  }, [otpSecret, showMessage, t]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action();
  }, []);

  // Мемоизированные стили
  const cardStyles = useMemo(() => ({
    borderRadius: 3,
    bgcolor: alpha(theme.palette.background.paper, 0.7),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    height: '100%',
  }), [theme]);

  const successPaperStyles = useMemo(() => ({
    flex: 1,
    minWidth: 180,
    p: 1.5,
    bgcolor: alpha(theme.palette.success.main, 0.1),
    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5
  }), [theme]);

  const renderDialogContent = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
          <Stack spacing={3}>
            <Alert severity="info" icon={<SecurityIcon />}>
              {t('settings.otpSetupWithRecoveryExplanation')}
            </Alert>
            
            <Typography variant="body2" color="text.secondary">
              {t('settings.enterPasswordToGenerateQR')}
            </Typography>

            <TextField
              label={t('settings.masterPassword')}
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              fullWidth
              variant="outlined"
              disabled={loading}
              onKeyPress={(e) => handleKeyPress(e, handleGenerateQRWithRecovery)}
              helperText={t('settings.passwordForRecoveryAccess')}
              autoFocus
            />

            <Alert severity="warning" icon={<WarningAmberIcon />}>
              {t('settings.rememberPasswordWarning')}
            </Alert>
          </Stack>
        );
      
      case 1:
        return (
          <Stack spacing={3}>
            <Alert severity="success">
              {t('settings.scanQRWithAuthenticator')}
            </Alert>
            
            {generatedQrUrl && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              >
                <QRCode
                  value={generatedQrUrl}
                  size={220}
                  bgColor="#ffffff"
                  fgColor={theme.palette.primary.main}
                  level="H"
                  includeMargin={true}
                  style={{ borderRadius: 12 }}
                />
                
                <Divider sx={{ width: '100%', my: 2 }} />
                
                {otpSecret && (
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      {t('settings.manualEntryKey')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mt: 1 }}>
                      <Typography 
                        variant="body2" 
                        fontFamily="monospace"
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          letterSpacing: 1
                        }}
                      >
                        {otpSecret}
                      </Typography>
                      <IconButton size="small" onClick={handleCopySecret}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </Paper>
            )}

            <Alert severity="info">
              {t('settings.recoveryAlreadyEnabled')}
            </Alert>
          </Stack>
        );
      
      case 2:
        return (
          <Stack spacing={3} alignItems="center" py={2}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('settings.setupSuccessful')}
            </Typography>
            <Stack spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {t('settings.twoFactorEnabled')}
              </Typography>
              <Typography variant="body2" color="success.main" textAlign="center" fontWeight={500}>
                {t('settings.recoveryAccessEnabled')}
              </Typography>
            </Stack>
          </Stack>
        );
      
      default:
        return null;
    }
  }, [activeStep, t, masterPassword, loading, generatedQrUrl, otpSecret, theme, handleKeyPress, handleGenerateQRWithRecovery, handleCopySecret]);

  const renderDialogActions = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <Button onClick={handleCloseSetupDialog} disabled={loading} sx={{color:"text.secondary"}}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleGenerateQRWithRecovery}
              variant="contained"
              disabled={loading || !masterPassword}
              startIcon={loading ? <CircularProgress size={20} /> : <QrCode2Icon />}
            >
              {t('settings.generateQR')}
            </Button>
          </>
        );
      
      case 1:
        return (
          <>
            <Button onClick={handleCloseSetupDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleComplete}
              variant="contained"
              startIcon={<CheckCircleIcon />}
            >
              {t('settings.done')}
            </Button>
          </>
        );
      
      case 2:
        return null;
      
      default:
        return null;
    }
  }, [activeStep, loading, masterPassword, t, handleCloseSetupDialog, handleGenerateQRWithRecovery, handleComplete]);

  const profilePicSrc = useMemo(() => 
    auth?.username ? profilePics[auth.username] : undefined,
    [auth?.username, profilePics]
  );

  const avatarInitial = useMemo(() => 
    auth?.username && !profilePics[auth.username] ? auth.username[0].toUpperCase() : null,
    [auth?.username, profilePics]
  );

  return (
    <>
      <Grid size={{ xs: 12, md: 4 }}>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card sx={cardStyles}>
            <CardContent>
              <Stack spacing={2} alignItems="center">
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  {t('settings.profilePicture')}
                </Typography>
                
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: profilePicSrc ? 'transparent' : 'primary.main',
                      border: `3px solid ${theme.palette.divider}`,
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.05)' }
                    }}
                    src={profilePicSrc}
                    onClick={() => profilePicInputRef.current?.click()}
                  >
                    {avatarInitial}
                  </Avatar>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                    size="small"
                    onClick={() => profilePicInputRef.current?.click()}
                  >
                    <CameraAltIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {auth?.username || t('settings.noUser')}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card sx={cardStyles}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight={600}>
                      {t('settings.twoFactorSecurity')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('settings.authenticatorAndRecovery')}
                    </Typography>
                  </Box>
                </Stack>
                
                {!hasOtp ? (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {t('settings.setup2FADescription')}
                    </Alert>
                    
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                      <Chip
                        icon={<QrCode2Icon />}
                        label={t('settings.authenticatorApp')}
                        variant="outlined"
                        color="primary"
                        size="small"
                      />
                      <Chip
                        icon={<VpnKeyIcon />}
                        label={t('settings.recoveryAccess')}
                        variant="outlined"
                        color="primary"
                        size="small"
                      />
                    </Stack>

                    <Button
                      variant="contained"
                      startIcon={<SecurityIcon />}
                      onClick={handleOpenSetupDialog}
                      sx={{ borderRadius: 2 }}
                      fullWidth
                    >
                      {t('settings.setupSecurity')}
                    </Button>
                  </Box>
                ) : (
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Paper elevation={0} sx={successPaperStyles}>
                      <Box
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          borderRadius: 1,
                          flexShrink: 0,
                          position: 'relative',
                          '&:hover': { transform: 'scale(1.05)' },
                          '&:hover::after': {
                            content: '"🔒"',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: 24,
                            bgcolor: alpha(theme.palette.background.paper, 0.9),
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1
                          }
                        }}
                        onClick={handleOpenViewQrDialog}
                      >
                        {qrCodeUrl && <MemoizedQRCode value={qrCodeUrl} size={80} theme={theme} />}
                      </Box>
                      <Stack spacing={0.5} flex={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {t('settings.authenticator')}
                        </Typography>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={t('settings.active')}
                          color="success"
                          size="small"
                          sx={{ width: 'fit-content' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {t('settings.clickToView')}
                        </Typography>
                      </Stack>
                    </Paper>
                    
                    <Paper
                      elevation={0}
                      sx={{
                        flex: 1,
                        minWidth: 180,
                        p: 1.5,
                        bgcolor: hasRecovery 
                          ? alpha(theme.palette.success.main, 0.1) 
                          : alpha(theme.palette.warning.main, 0.1),
                        border: `1px solid ${hasRecovery 
                          ? alpha(theme.palette.success.main, 0.3)
                          : alpha(theme.palette.warning.main, 0.3)}`,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                      }}
                    >
                      <VpnKeyIcon 
                        sx={{ 
                          fontSize: 60, 
                          color: hasRecovery ? 'success.main' : 'warning.main',
                          flexShrink: 0
                        }} 
                      />
                      <Stack spacing={0.5} flex={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {t('settings.recovery')}
                        </Typography>
                        <Chip
                          icon={hasRecovery ? <CheckCircleIcon /> : <WarningAmberIcon />}
                          label={hasRecovery ? t('settings.enabled') : t('settings.notSetup')}
                          color={hasRecovery ? 'success' : 'warning'}
                          size="small"
                          sx={{ width: 'fit-content' }}
                        />
                        {!hasRecovery && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<SettingsIcon />}
                            onClick={handleOpenSetupDialog}
                            sx={{ width: 'fit-content', p: 0.5, color:"text.secondary", borderRadius:2 }}
                            
                          >
                            {t('settings.setupNow')}
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      <Dialog 
        open={openSetupDialog} 
        onClose={activeStep === 2 ? undefined : handleCloseSetupDialog}
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown={activeStep === 2}
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <SecurityIcon color="primary" />
            <Typography variant="h6">
              {hasOtp ? t('settings.setupRecovery') : t('settings.setupTwoFactor')}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          {renderDialogContent}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {renderDialogActions}
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openViewQrDialog} 
        onClose={handleCloseViewQrDialog}
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <VpnKeyIcon color="primary" />
            <Typography variant="h6">{t('settings.verifyIdentity')}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning" icon={<SecurityIcon />}>
              {t('settings.qrCodeProtected')}
            </Alert>
            
            <Typography variant="body2" color="text.secondary">
              {t('settings.enterPasswordToView')}
            </Typography>

            <TextField
              label={t('settings.masterPassword')}
              type="password"
              value={viewQrPassword}
              onChange={(e) => setViewQrPassword(e.target.value)}
              fullWidth
              variant="outlined"
              disabled={verifyingPassword}
              onKeyPress={(e) => handleKeyPress(e, handleVerifyPasswordAndShowQr)}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseViewQrDialog} 
            disabled={verifyingPassword}
            sx={{color:"text.secondary"}}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleVerifyPasswordAndShowQr}
            variant="contained"
            disabled={verifyingPassword || !viewQrPassword}
            startIcon={verifyingPassword ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              
          >
            {t('settings.verify')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

ProfileSection.displayName = 'ProfileSection';