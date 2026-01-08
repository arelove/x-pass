/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

export const neonThemeConfig = {
  primary: { main: '#00F0FF' },
  secondary: { main: '#FF00F5' },
  success: { main: '#39FF14' },
  error: { main: '#FF073A' },
  background: { default: '#0D0221', paper: '#1A0B2E' },
  text: { primary: '#FFFFFF', secondary: '#B8B8FF' },
};

export const neonThemeStyles = {
  background: 'linear-gradient(135deg, #0D0221 0%, #1A0B2E 50%, #0D0221 100%)',
  preBackground: 'rgba(0, 240, 255, 0.08)',
  selection: '#00F0FF66',
  selectionColor: '#FFFFFF',
  fontFamily: '"Orbitron", "Rajdhani", sans-serif',
  textShadow: '0 0 8px currentColor',
  letterSpacing: '0.03em',
  border: '1px solid rgba(0, 240, 255, 0.4)',
  boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
  hasEffects: true,
  hasAnimatedBackground: true,
  animationCSS: `
    @keyframes neon-pulse {
      0%, 100% { 
        opacity: 1;
        filter: brightness(1);
      }
      50% { 
        opacity: 0.9;
        filter: brightness(1.2);
      }
    }
    @keyframes neon-flow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 20% 30%, rgba(0, 240, 255, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(255, 0, 245, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(57, 255, 20, 0.08) 0%, transparent 50%);
      background-size: 200% 200%;
      pointer-events: none;
      animation: neon-flow 15s ease infinite, neon-pulse 3s ease-in-out infinite;
      z-index: 1;
    }
    body::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(0, 240, 255, 0.03) 3px,
          rgba(0, 240, 255, 0.03) 6px
        ),
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 3px,
          rgba(255, 0, 245, 0.03) 3px,
          rgba(255, 0, 245, 0.03) 6px
        );
      pointer-events: none;
      z-index: 1;
    }
  `,
};
