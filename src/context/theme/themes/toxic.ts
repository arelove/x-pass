/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

export const toxicThemeConfig = {
  primary: { main: '#39FF14' },
  secondary: { main: '#CCFF00' },
  success: { main: '#7FFF00' },
  error: { main: '#FF4500' },
  background: { default: '#0B0B0B', paper: '#1A1A1A' },
  text: { primary: '#E0FFE0', secondary: '#88FF88' },
};

export const toxicThemeStyles = {
  background: 'linear-gradient(135deg, #0B0B0B 0%, #1A1A1A 50%, #0B0B0B 100%)',
  preBackground: 'rgba(57, 255, 20, 0.08)',
  selection: '#39FF1466',
  selectionColor: '#000000',
  fontFamily: '"Share Tech Mono", "Roboto Mono", monospace',
  textShadow: '0 0 6px currentColor',
  letterSpacing: '0.04em',
  border: '1px solid rgba(57, 255, 20, 0.3)',
  boxShadow: '0 0 20px rgba(57, 255, 20, 0.15)',
  hasEffects: true,
  hasAnimatedBackground: true,
  animationCSS: `
    @keyframes toxic-drip {
      0% { transform: translateY(-100%); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(100vh); opacity: 0; }
    }
    @keyframes toxic-glow {
      0%, 100% { 
        box-shadow: 0 0 20px rgba(57, 255, 20, 0.2);
        filter: brightness(1);
      }
      50% { 
        box-shadow: 0 0 40px rgba(57, 255, 20, 0.4);
        filter: brightness(1.3);
      }
    }
    @keyframes toxic-radiation {
      0% { transform: scale(1) rotate(0deg); opacity: 0.1; }
      50% { transform: scale(1.5) rotate(180deg); opacity: 0.05; }
      100% { transform: scale(1) rotate(360deg); opacity: 0.1; }
    }
    body::before {
      content: '';
      position: fixed;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: 
        radial-gradient(circle at 30% 40%, rgba(57, 255, 20, 0.12) 0%, transparent 30%),
        radial-gradient(circle at 70% 60%, rgba(204, 255, 0, 0.10) 0%, transparent 30%),
        radial-gradient(circle at 50% 50%, rgba(57, 255, 20, 0.08) 0%, transparent 40%);
      pointer-events: none;
      animation: toxic-radiation 20s ease-in-out infinite;
      z-index: 1;
    }
    body::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(57, 255, 20, 0.3) 25%, 
        rgba(57, 255, 20, 0.6) 50%, 
        rgba(57, 255, 20, 0.3) 75%, 
        transparent 100%);
      pointer-events: none;
      animation: toxic-drip 8s linear infinite;
      z-index: 1;
    }
  `,
};
