/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LockOpen, AlertCircle, Check, Sparkles } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '../context/theme/ThemeContext';
import { useTranslation } from 'react-i18next';

interface UnlockAnimationProps {
  username: string;
  isSuccess: boolean;
  onAnimationComplete?: () => void;
}

function UnlockAnimation({ username, isSuccess, onAnimationComplete }: UnlockAnimationProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  useContext(ThemeContext);
  const [pinProgress, setPinProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);

  useEffect(() => {
    startUnlockSequence();
  }, []);

  const startUnlockSequence = async () => {
    for (let i = 1; i <= 4; i++) {
      await new Promise(resolve => setTimeout(resolve, 180));
      setPinProgress(i);
    }

    await new Promise(resolve => setTimeout(resolve, 350));
    setShowResult(true);

    if (isSuccess) {
      setRipples([0, 1, 2, 3]);
    }

    if (isSuccess && onAnimationComplete) {
      setTimeout(() => {
        onAnimationComplete();
      }, 1800);
    } else if (!isSuccess) {
      setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 2200);
    }
  };

  const pinDots = [0, 1, 2, 3];
  
  // Theme colors
  const statusColor = isSuccess 
    ? theme.palette.success.main 
    : theme.palette.error.main;
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const backgroundColor = theme.palette.background.default;
  const backgroundPaper = theme.palette.background.paper;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundPaper} 100%)`,
        color: textPrimary,
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Animated gradient orbs */}
      <motion.div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 40%, ${primaryColor}15 0%, transparent 60%)`,
          filter: 'blur(60px)',
          top: '-10%',
          left: '-10%',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle at 70% 60%, ${secondaryColor}12 0%, transparent 60%)`,
          filter: 'blur(50px)',
          bottom: '-5%',
          right: '-5%',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      

      {/* Logo/Brand with shimmer */}
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative' }}
      >
        <motion.div
          animate={{
            filter: [
              `drop-shadow(0 0 20px ${primaryColor}00)`,
              `drop-shadow(0 0 30px ${primaryColor}30)`,
              `drop-shadow(0 0 20px ${primaryColor}00)`,
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <h1
            style={{
              fontSize: '3.5rem',
              fontWeight: 800,
              marginBottom: '0.5rem',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '3px',
              position: 'relative',
              margin: 0,
            }}
          >
            X-PASS
          </h1>
        </motion.div>
        
        <motion.div
          style={{
            position: 'absolute',
            top: -5,
            right: -25,
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <Sparkles size={20} color={primaryColor} style={{ opacity: 0.6 }} />
        </motion.div>
      </motion.div>

      {/* Lock Container */}
      <div style={{ position: 'relative', margin: '3rem 0' }}>
        {/* Glow effect behind lock */}
        <motion.div
          style={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: showResult
              ? `radial-gradient(circle, ${statusColor}30 0%, transparent 70%)`
              : `radial-gradient(circle, ${primaryColor}25 0%, transparent 70%)`,
            filter: 'blur(20px)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
          }}
          animate={{
            scale: showResult ? [1, 1.4, 1.2] : [1, 1.15, 1],
            opacity: showResult ? [0.5, 1, 0.7] : [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: showResult ? 0.8 : 2,
            repeat: showResult ? 0 : Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Success ripple effect */}
      <AnimatePresence>
        {showResult && isSuccess && ripples.map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: `2px solid ${statusColor}`,
              pointerEvents: 'none',
              
            }}
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{
              scale: [0.8, 3.5],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.15,
              ease: "easeOut"
            }}
          />
        ))}
      </AnimatePresence>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 0.3, 
            duration: 0.8, 
            type: 'spring', 
            stiffness: 180,
            damping: 12
          }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <motion.div
            animate={{
              background: showResult
                ? `linear-gradient(135deg, ${statusColor}18 0%, ${statusColor}35 100%)`
                : `linear-gradient(135deg, ${primaryColor}18 0%, ${secondaryColor}25 100%)`,
              borderColor: showResult ? statusColor : primaryColor,
            }}
            transition={{ duration: 0.5 }}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              border: '2px solid',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Success particle burst */}
            <AnimatePresence>
              {showResult && isSuccess && (
                <>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 360) / 12;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                        animate={{
                          scale: [0, 1.5, 0],
                          x: Math.cos(angle * Math.PI / 180) * 70,
                          y: Math.sin(angle * Math.PI / 180) * 70,
                          opacity: [1, 0.8, 0],
                        }}
                        transition={{ duration: 1, delay: i * 0.03, ease: "easeOut" }}
                        style={{
                          position: 'absolute',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}80 100%)`,
                          boxShadow: `0 0 10px ${statusColor}`,
                        }}
                      />
                    );
                  })}
                  {/* Additional sparkle particles */}
                  {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i * 360) / 8 + 22.5;
                    return (
                      <motion.div
                        key={`sparkle-${i}`}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
                        animate={{
                          scale: [0, 1, 0.5],
                          x: Math.cos(angle * Math.PI / 180) * 55,
                          y: Math.sin(angle * Math.PI / 180) * 55,
                          opacity: [1, 1, 0],
                          rotate: [0, 180],
                        }}
                        transition={{ duration: 1.2, delay: 0.1 + i * 0.04, ease: "easeOut" }}
                        style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          background: statusColor,
                          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                        }}
                      />
                    );
                  })}
                </>
              )}
            </AnimatePresence>

            {/* Error shake effect */}
            <AnimatePresence>
              {showResult && !isSuccess && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const angle = (i * 360) / 6;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                        animate={{
                          scale: [0, 1.2, 0.8, 0],
                          x: [
                            0,
                            Math.cos(angle * Math.PI / 180) * 35,
                            Math.cos(angle * Math.PI / 180) * 25,
                            Math.cos(angle * Math.PI / 180) * 50,
                          ],
                          y: [
                            0,
                            Math.sin(angle * Math.PI / 180) * 35,
                            Math.sin(angle * Math.PI / 180) * 25,
                            Math.sin(angle * Math.PI / 180) * 50,
                          ],
                          opacity: [1, 0.9, 0.5, 0],
                        }}
                        transition={{ duration: 0.8, delay: i * 0.04 }}
                        style={{
                          position: 'absolute',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: statusColor,
                          boxShadow: `0 0 8px ${statusColor}`,
                        }}
                      />
                    );
                  })}
                </>
              )}
            </AnimatePresence>

            {/* Lock Icon with enhanced animation */}
            <motion.div
              animate={
                showResult && !isSuccess
                  ? {
                      x: [-8, 8, -8, 8, -4, 4, 0],
                      rotate: [-8, 8, -8, 8, -4, 4, 0],
                    }
                  : showResult && isSuccess
                  ? {
                      y: [-5, 5, 0],
                      rotate: [0, -15, 15, -8, 8, 0],
                    }
                  : {
                      rotate: [0, -3, 3, 0],
                    }
              }
              transition={{ 
                duration: showResult ? 0.6 : 4,
                repeat: showResult ? 0 : Infinity,
                ease: showResult ? "easeInOut" : "easeInOut"
              }}
            >
              <AnimatePresence mode="wait">
                {showResult && isSuccess ? (
                  <motion.div
                    key="unlocked"
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                  >
                    <LockOpen size={56} color={statusColor} strokeWidth={2} />
                  </motion.div>
                ) : showResult && !isSuccess ? (
                  <motion.div
                    key="error"
                    initial={{ scale: 0, rotate: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.3, 1], 
                      rotate: [0, 15, -15, 10, -10, 0],
                      opacity: 1
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <AlertCircle size={56} color={statusColor} strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="locked"
                    initial={{ scale: 1 }}
                    exit={{ scale: 0, rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    animate={{
                      y: [0, -2, 0],
                    }}
                  >
                    <Lock size={56} color={primaryColor} strokeWidth={2} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* PIN Dots with enhanced design */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            justifyContent: 'center',
          }}
        >
          {pinDots.map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                delay: 0.5 + index * 0.1,
                duration: 0.4,
                type: 'spring',
                stiffness: 300,
                damping: 15,
              }}
            >
              <motion.div
                animate={{
                  backgroundColor: pinProgress > index 
                    ? showResult 
                      ? statusColor 
                      : primaryColor
                    : theme.palette.mode === 'light' ? '#e2e8f0' : '#475569',
                  scale: pinProgress === index + 1 ? 1.3 : 1,
                  boxShadow: pinProgress > index 
                    ? showResult
                      ? `0 0 20px ${statusColor}90, 0 0 35px ${statusColor}40`
                      : `0 0 15px ${primaryColor}70, 0 0 25px ${primaryColor}30`
                    : 'none',
                }}
                transition={{ 
                  backgroundColor: { duration: 0.3 },
                  scale: { 
                    duration: 0.2,
                    type: 'spring',
                    stiffness: 400,
                    damping: 15
                  },
                  boxShadow: { duration: 0.3 }
                }}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  border: `2px solid ${pinProgress > index ? 'transparent' : (theme.palette.mode === 'light' ? '#cbd5e1' : '#334155')}`,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Username with enhanced styling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: textPrimary,
            textAlign: 'center',
            marginBottom: '0.25rem',
            letterSpacing: '0.5px',
            margin: 0,
          }}
        >
          {username}
        </h2>
        <p
          style={{
            color: textSecondary,
            textAlign: 'center',
            opacity: 0.7,
            fontSize: '0.875rem',
            margin: '0.5rem 0 0 0',
          }}
        >
          {t('unlock.authenticating')}
        </p>
      </motion.div>

      {/* Result Message with ABSOLUTE positioning - Ð½Ðµ Ð²Ð»Ð¸ÑÐµÑ‚ Ð½Ð° layout */}
      <AnimatePresence mode="wait">
        {showResult && (
          <motion.div
            key={isSuccess ? 'success' : 'error'}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
  position: 'absolute',
  bottom: '40px',
  right: '40px',
  transform: 'translateX(-50%)',
}}
          >
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '0.75rem 1.5rem',
                borderRadius: '50px',
                background: `${statusColor}15`,
                border: `1px solid ${statusColor}30`,
                backdropFilter: 'blur(10px)',
                whiteSpace: 'nowrap',
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: isSuccess ? [0, 360] : [0, -10, 10, -10, 10, 0],
                }}
                transition={{ 
                  duration: isSuccess ? 0.6 : 0.5,
                  ease: "easeInOut"
                }}
              >
                {isSuccess ? (
                  <Check size={24} color={statusColor} strokeWidth={3} />
                ) : (
                  <AlertCircle size={24} color={statusColor} strokeWidth={2.5} />
                )}
              </motion.div>
              <span
                style={{ 
                  color: statusColor, 
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '0.3px',
                }}
              >
                {isSuccess ? t('unlock.accessGranted') : t('unlock.accessDenied')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showResult ? 0 : 0.5 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: '24px',
            height: '24px',
            border: `2px solid ${theme.palette.mode === 'light' ? '#cbd5e1' : '#334155'}`,
            borderTopColor: primaryColor,
            borderRadius: '50%',
          }}
        />
      </motion.div>
    </div>
  );
}

export default UnlockAnimation;
