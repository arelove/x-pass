/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Lock, LockOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WelcomeScreenProps {
  username: string;
}

function WelcomeScreen({ username }: WelcomeScreenProps) {
  const theme = useTheme();
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsUnlocked(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const pinDots = [0, 1, 2, 3];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        color: theme.palette.text.primary,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Background animated circles */}
      <motion.div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.palette.primary.main}15 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Logo/Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '2px',
          }}
        >
          X-PASS
        </Typography>
      </motion.div>

      {/* Lock Animation */}
      <Box sx={{ position: 'relative', my: 4 }}>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 200 }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.primary.main}40 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <motion.div
              animate={{
                rotate: isUnlocked ? [0, -10, 10, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              {isUnlocked ? (
                <LockOpen size={40} color={theme.palette.primary.main} />
              ) : (
                <Lock size={40} color={theme.palette.primary.main} />
              )}
            </motion.div>
          </Box>
        </motion.div>

        {/* PIN Dots */}
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            mt: 3,
            justifyContent: 'center',
          }}
        >
          {pinDots.map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.6 + index * 0.1,
                duration: 0.3,
                type: 'spring',
                stiffness: 300,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: theme.palette.primary.main,
                  boxShadow: `0 0 10px ${theme.palette.primary.main}60`,
                }}
              />
            </motion.div>
          ))}
        </Box>
      </Box>

      {/* Welcome Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.secondary,
            textAlign: 'center',
          }}
        >
          Welcome back, <span style={{ color: theme.palette.primary.main, fontWeight: 600 }}>{username}</span>
        </Typography>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        style={{ marginTop: '32px' }}
      >
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: theme.palette.primary.main,
                }}
              />
            </motion.div>
          ))}
        </Box>
      </motion.div>
    </Box>
  );
}

export default WelcomeScreen;
