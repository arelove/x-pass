/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

export const cyberpunkThemeConfig = {
  primary: { main: '#FFD700' },
  secondary: { main: '#FFA500' },
  success: { main: '#90EE90' },
  error: { main: '#FF6B6B' },
  background: { default: '#1C1C1E', paper: '#2C2C2E' },
  text: { primary: '#E5E5E7', secondary: '#98989D' },
};

export const cyberpunkThemeStyles = {
  background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 50%, #1C1C1E 100%)',
  preBackground: 'rgba(255, 215, 0, 0.05)',
  selection: '#FFD70066',
  selectionColor: '#1C1C1E',
  fontFamily: '"Roboto Mono", "Courier New", monospace',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.08)',
  letterSpacing: '0.02em',
  hasAnimatedBackground: true,
  animationCSS: `
    @keyframes cyber-grid {
      0% { background-position: 0 0; }
      100% { background-position: 50px 50px; }
    }
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(255, 215, 0, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 215, 0, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
      animation: cyber-grid 20s linear infinite;
      z-index: 1;
    }
    body::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(255, 165, 0, 0.05) 0%, transparent 50%);
      pointer-events: none;
      z-index: 1;
    }
  `,
};
