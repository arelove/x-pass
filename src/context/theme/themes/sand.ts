/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

export const sandThemeConfig = {
  primary: { main: '#d59047ff' },
  secondary: { main: '#c18c4bff' },
  success: { main: '#8B9556' },
  error: { main: '#B8604C' },
  background: { default: '#f4d9b6ff', paper: '#FFF8F0' },
  text: { primary: '#3E2723', secondary: '#6D4C41' },
};

export const sandThemeStyles = {
  background: 'linear-gradient(135deg, #fbe4c6ff 0%, #f8d8b3ff 50%, #fcd095ff 100%)',
  preBackground: 'rgba(200, 109, 13, 0.08)',
  selection: '#D4A57466',
  selectionColor: '#3E2723',
  fontFamily: '"Inter", "Georgia", serif',
  border: '1px solid rgba(212, 165, 116, 0.2)',
  boxShadow: '0 4px 12px rgba(193, 154, 107, 0.15)',
  hasAnimatedBackground: true,
  animationCSS: `
    @keyframes sand-wave {
      0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
      33% { transform: translateX(30px) translateY(-15px) rotate(2deg); }
      66% { transform: translateX(-20px) translateY(10px) rotate(-2deg); }
    }
    @keyframes sand-shimmer {
      0%, 100% { opacity: 0.03; }
      50% { opacity: 0.08; }
    }
    body::before {
      content: '';
      position: fixed;
      top: -10%;
      left: -10%;
      width: 120%;
      height: 120%;
      background: 
        radial-gradient(ellipse at 30% 40%, rgba(212, 165, 116, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 70% 60%, rgba(193, 154, 107, 0.10) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(212, 165, 116, 0.08) 0%, transparent 40%);
      pointer-events: none;
      animation: sand-wave 25s ease-in-out infinite;
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
          45deg,
          transparent,
          transparent 80px,
          rgba(212, 165, 116, 0.02) 80px,
          rgba(212, 165, 116, 0.02) 160px
        );
      pointer-events: none;
      animation: sand-shimmer 8s ease-in-out infinite;
      z-index: 1;
    }
  `,
};
