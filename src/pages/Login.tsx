/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
import React, { useState, useEffect, useContext } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Box,
  Grid,
  Avatar,
  Typography,
  TextField,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/theme/ThemeContext';
import { SnackbarContext } from '../components/SnackbarProvider';

interface LoginProps {
  setLogin: (username: string, user_id: number, encKey: string) => void;
  onLoginFailed?: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ setLogin }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { customTheme, mode } = React.useContext(ThemeContext);
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingSecret, setIsCreatingSecret] = useState(false);
  const [masterPass, setMasterPass] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPassRepeat, setNewPassRepeat] = useState('');
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const { showMessage } = useContext(SnackbarContext)!;
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [hasOTP, setHasOTP] = useState(false);
  const [photoSettingEnabled, setPhotoSettingEnabled] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    invoke<string[]>('list_users')
      .then(setUsers)
      .catch((err) => console.error('Failed to fetch users:', err));
    try {
      const storedPics = localStorage.getItem('profilePics');
      if (storedPics) {
        setProfilePics(JSON.parse(storedPics));
      }
    } catch (err) {
      console.error('Failed to load profile pics:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      invoke<boolean>('has_otp_secret', { username: selectedUser })
        .then((result) => setHasOTP(result))
        .catch((err) => console.error('Failed to check OTP secret:', err));
    }
  }, [selectedUser]);

  useEffect(() => {
    const loadPhotoSetting = async () => {
      if (selectedUser) {
        try {
          const enabled = await invoke<boolean>('is_photo_setting_enabled_for_username', { 
            username: selectedUser 
          });
          setPhotoSettingEnabled(enabled);
          console.log(`Photo setting for ${selectedUser}:`, enabled);
        } catch (err) {
          console.error('Failed to load photo setting:', err);
          setPhotoSettingEnabled(false);
        }
      } else {
        setPhotoSettingEnabled(false);
      }
    };
    
    loadPhotoSetting();
  }, [selectedUser]);

  const captureFailedLoginPhoto = async (username: string) => {
    if (!photoSettingEnabled) {
      console.log('Photo capture disabled for this user');
      return; 
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
      }

      stream.getTracks().forEach(track => track.stop());
      
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      
      await invoke('save_failed_login_photo', {
        username,
        photoData,
        usernameAttempt: username
      });
      
      console.log('Failed login photo captured and saved');
    } catch (err) {
      console.error('Failed to capture photo:', err);
    }
  };

  const handleSelectUser = (user: string) => {
    setSelectedUser((prev) => (prev === user ? null : user));
    setMasterPass('');
    setIsCreating(false);
    setIsCreatingSecret(false);
    setShowOTP(false);
    setFailedAttempts(0);
    setOtpCode('');
    setIsShaking(false);
    setPasswordError(false);
  };

  const handleCreateClick = () => {
    setIsCreating((prev) => !prev);
    setSelectedUser(null);
    setIsCreatingSecret(false);
    setNewUser('');
    setNewPass('');
    setNewPassRepeat('');
    setShowOTP(false);
    setFailedAttempts(0);
    setOtpCode('');
  };

  const handleLogin = async () => {
    if (selectedUser) {
      try {
        const [user_id, enc_key] = await invoke<[number, string]>('login', { 
          username: selectedUser, 
          masterPass 
        });
        setLogin(selectedUser, user_id, enc_key);
        setSelectedUser(null);
        setMasterPass('');
        setFailedAttempts(0);
        setShowOTP(false);
        setOtpCode('');
        setPasswordError(false);
        setIsShaking(false);
      } catch (err) {
        setPasswordError(true);
        setIsShaking(true);
        showMessage(t('login.loginFailed'), 'error');

        await captureFailedLoginPhoto(selectedUser);

        setTimeout(() => {
          setIsShaking(false);
        }, 600);

        setTimeout(() => {
          setPasswordError(false);
          setMasterPass('');
        }, 2000);
        
        setFailedAttempts((prev) => prev + 1);
        
        if (failedAttempts + 1 >= 1 && hasOTP) {
          setShowOTP(true);
        } else if (failedAttempts + 1 >= 1 && !hasOTP) {
          showMessage(t('login.noOTPSetup'), 'warning');
        }
      }
    }
  };

  const handleOTPLogin = async () => {
  if (selectedUser && otpCode) {
    try {
      const [user_id, enc_key, _is_pseudo] = await invoke<[number, string, boolean]>('login_with_otp', { 
        username: selectedUser,
        otpCode: otpCode
      });
      
      setLogin(selectedUser, user_id, enc_key);
      setSelectedUser(null);
      setMasterPass('');
      setFailedAttempts(0);
      setShowOTP(false);
      setOtpCode('');
      setPasswordError(false);
      setIsShaking(false);
      showMessage(t('login.loginSuccess'), 'success');
    } catch (err: any) {
      console.error('OTP login error:', err);
      
      if (err.includes('OTP recovery not set up')) {
        showMessage(t('login.otpRecoveryNotSetup'), 'warning');
      } else if (err.includes('Invalid OTP code')) {
        showMessage(t('login.invalidOTP'), 'error');
        setOtpCode('');
      } else {
        showMessage(t('login.otpVerificationFailed'), 'error');
      }
    }
  }
};

  const handleCreate = async (isSecret: boolean = false) => {
    if (newPass !== newPassRepeat) {
      showMessage(t('login.passwordsMismatch'), 'error');
      return;
    }
    try {
      await invoke('create_user', { username: newUser, masterPass: newPass, isSecret });
      const [user_id, enc_key] = await invoke<[number, string]>('login', { 
        username: newUser, 
        masterPass: newPass 
      });
      setLogin(newUser, user_id, enc_key);
      setIsCreating(false);
      setIsCreatingSecret(false);
      setNewUser('');
      setNewPass('');
      setNewPassRepeat('');
      showMessage(t('login.createSuccess'), 'success');
      showMessage(t('login.setupOTP'), 'info');
    } catch (err) {
      showMessage(t('login.createFailed'), 'error');
    }
  };

  const avatarVariants = {
    normal: { scale: 1, width: 80, height: 80, opacity: 1, position: 'relative', left: '50%', top: '25%' },
    selected: {
      scale: 1.5,
      width: 120,
      height: 120,
      opacity: 1,
      position: 'absolute',
      transition: { duration: 0.1, ease: 'easeOut' as const },
    },
    hidden: {
      opacity: 0,
      transition: { duration: 0.1, ease: 'easeOut' as const },
    },
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -20 },
  };

  const isActive = selectedUser || isCreating || isCreatingSecret;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '82vh',
        bgcolor: 'transparent',
        px: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: 800, opacity: isActive ? 0 : 1, transition: 'opacity 0.2s ease' }}>
        {users.map((user) => (
          <Grid key={user}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  cursor: 'pointer',
                  bgcolor: profilePics[user]
                    ? 'transparent'
                    : mode === 'custom'
                    ? customTheme.primary
                    : theme.palette.primary.main,
                  border: '2px solid',
                  borderColor: mode === 'custom' ? customTheme.textSecondary : 'divider',
                }}
                src={profilePics[user]}
                onClick={() => handleSelectUser(user)}
              >
                {!profilePics[user] && user[0].toUpperCase()}
              </Avatar>
            </motion.div>
            <Typography align="center" sx={{ mt: 1, color: mode === 'custom' ? customTheme.textPrimary : 'text.primary' }}>
              {user}
            </Typography>
          </Grid>
        ))}
        <Grid>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: mode === 'custom' ? customTheme.textSecondary : 'divider',
                fontSize: '2rem',
              }}
              onClick={handleCreateClick}
            >
              ?
            </Avatar>
          </motion.div>
        </Grid>
      </Grid>

      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              variants={avatarVariants}
              initial="normal"
              animate="selected"
              exit="hidden"
              onClick={() => handleSelectUser(selectedUser)}
            >
              <Avatar
                sx={{
                  width: 'inherit',
                  height: 'inherit',
                  cursor: 'pointer',
                  position: 'absolute',
                  right: 40,
                  maxWidth: 300,
                  bgcolor: profilePics[selectedUser]
                    ? 'transparent'
                    : mode === 'custom'
                    ? customTheme.primary
                    : theme.palette.primary.main,
                  border: '1px solid',
                  borderColor: mode === 'custom' ? customTheme.textSecondary : 'divider',
                }}
                src={profilePics[selectedUser]}
              >
                {!profilePics[selectedUser] && selectedUser[0].toUpperCase()}
              </Avatar>
            </motion.div>
            <motion.div
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: 'absolute',
                left: '50%',
                top: 'calc(30% + 140px)',
                x: '-50%',
                width: '100%',
                maxWidth: 300,
              }}
            >
              <motion.div
                animate={isShaking ? {
                  x: [-10, 10, -10, 10, -8, 8, -4, 4, 0],
                } : {}}
                transition={{ duration: 0.6 }}
              >
              <TextField
                  label={t('login.masterPassword')}
                  type="password"
                  value={masterPass}
                  onChange={(e) => setMasterPass(e.target.value)}
                  fullWidth
                  variant="outlined"
                  error={passwordError}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-error': {
                        '& fieldset': {
                          borderColor: 'error.main',
                          borderWidth: 2,
                        },
                      },
                    },
                    '& .MuiInputBase-input': {
                      transition: 'all 0.3s ease',
                    }
                  }}
                  onKeyUp={(e) => e.key === 'Enter' && handleLogin()}
                />
              </motion.div>
              <Button
                variant="contained"
                onClick={handleLogin}
                fullWidth
                sx={{
                  bgcolor: mode === 'custom' ? customTheme.primary : 'primary.main',
                  '&:hover': { bgcolor: mode === 'custom' ? `${customTheme.primary}cc` : 'primary.dark' },
                  mb: showOTP ? 2 : 0,
                  transition: 'all 0.3s ease',
                }}
              >
                {t('login.login')}
              </Button>
              {showOTP && (
                <>
                  <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
                    {t('login.forgotPassword')}
                  </Typography>
                  <TextField
                    label={t('login.otpCode')}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                    onKeyPress={(e) => e.key === 'Enter' && handleOTPLogin()}
                  />
                  <Button
                    variant="contained"
                    onClick={handleOTPLogin}
                    fullWidth
                    sx={{
                      bgcolor: mode === 'custom' ? customTheme.primary : 'primary.main',
                      '&:hover': { bgcolor: mode === 'custom' ? `${customTheme.primary}cc` : 'primary.dark' },
                      mb: 2,
                    }}
                  >
                    {t('login.loginWithOTP')}
                  </Button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating && (
          <>
            <motion.div
              variants={avatarVariants}
              initial="normal"
              animate="selected"
              exit="hidden"
              onClick={handleCreateClick}
            >
              <Avatar
                sx={{
                  width: 'inherit',
                  height: 'inherit',
                  cursor: 'pointer',
                  top: '-30%',
                  border: '2px solid',
                  borderColor: mode === 'custom' ? customTheme.textSecondary : 'divider',
                  fontSize: '3rem',
                  right: 40,
                }}
              >
                ?
              </Avatar>
            </motion.div>
            <motion.div
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: 'absolute',
                left: '50%',
                top: 'calc(30% + 80px)',
                x: '-50%',
                width: '100%',
                maxWidth: 300,
              }}
            >
              <TextField
                label={t('login.username')}
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
              <TextField
                label={t('login.masterPassword')}
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
              <TextField
                label={t('login.repeatPassword')}
                type="password"
                value={newPassRepeat}
                onChange={(e) => setNewPassRepeat(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button
                variant="contained"
                onClick={() => handleCreate()}
                fullWidth
                sx={{
                  bgcolor: mode === 'custom' ? customTheme.primary : 'primary.main',
                  '&:hover': { bgcolor: mode === 'custom' ? `${customTheme.primary}cc` : 'primary.dark' },
                }}
              >
                {t('login.create')}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default Login;
