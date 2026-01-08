/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

import { useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CustomTitleBar from './window/CustomTitleBar';
import Sidebar from './components/Sidebar';
import Settings from './pages/SettingsPage';
import SmoothScrollContainer from './components/SmoothScrollbar';
import Login from './pages/Login';
import Vault from './pages/Vault';
// import WelcomeScreen from './components/WelcomeScreen';
import UnlockAnimation from './components/UnlockAnimation';
import { AuthContext } from './context/AuthContext';
import { SnackbarProvider } from './components/SnackbarProvider';
import { PseudoModeProvider } from './context/PseudoModeContext';

type OverlayState = 'none' | 'unlocking' 
// | 'welcome'
;

function App() {
  const [overlayState, setOverlayState] = useState<OverlayState>('none');
  const [isUnlockSuccess, setIsUnlockSuccess] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{username: string, user_id: number, encKey: string} | null>(null);
  const { auth, setAuth } = useContext(AuthContext);

  const handleLogin = (username: string, user_id: number, encKey: string) => {
    setPendingAuth({ username, user_id, encKey });
    setIsUnlockSuccess(true);
    setOverlayState('unlocking');
  };

  const handleLoginFailed = (username: string) => {
    setPendingAuth({ username, user_id: 0, encKey: '' });
    setIsUnlockSuccess(false);
    setOverlayState('unlocking');
  };

  const handleUnlockComplete = () => {
    if (isUnlockSuccess && pendingAuth && pendingAuth.user_id !== 0) {
      setAuth(pendingAuth);
      setOverlayState('none');
      setPendingAuth(null);
      
    } else {
      setOverlayState('none');
      setPendingAuth(null);
    }
  };

  return (
    <Router>
      <PseudoModeProvider userId={auth?.user_id || null}>
        <Box sx={{ 
          display: 'flex', 
          height: '100vh', 
          overflow: 'hidden', 
          bgcolor: 'transparent',
          position: 'relative'
        }}>
          {auth && <Sidebar />}
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            ml: auth ? 4 : 0, 
            bgcolor: 'transparent', 
            overflow: 'hidden',
            height: '100vh'
          }}>
            <CustomTitleBar />
            <SnackbarProvider>
              <SmoothScrollContainer height="calc(100vh - 32px)">
                {auth ? (
                  <Routes>
                    <Route path="/" element={<Vault />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                ) : (
                  <Login 
                    setLogin={handleLogin} 
                    onLoginFailed={handleLoginFailed}
                  />
                )}
              </SmoothScrollContainer>
            </SnackbarProvider>
          </Box>

          {/* Overlay animations */}
          <AnimatePresence>
            {overlayState === 'unlocking' && pendingAuth && (
              <motion.div
                key="unlock"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ 
                  position: 'absolute', 
                  top: 0,
                  left: 0,
                  width: '100%', 
                  height: '100%', 
                  zIndex: 9999,
                  pointerEvents: 'all'
                }}
              >
                <UnlockAnimation
                  username={pendingAuth.username}
                  isSuccess={isUnlockSuccess}
                  onAnimationComplete={handleUnlockComplete}
                />
              </motion.div>
            )}
            
            {/* {overlayState === 'welcome' && auth && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ 
                  position: 'absolute', 
                  top: 0,
                  left: 0,
                  width: '100%', 
                  height: '100%', 
                  zIndex: 9998,
                  pointerEvents: 'all'
                }}
              >
                <WelcomeScreen username={auth.username} />
              </motion.div>
            )} */}
          </AnimatePresence>
        </Box>
      </PseudoModeProvider>
    </Router>
  );
}

export default App;