import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppFlowState, UserSession } from './types';
import { LoginModal } from './components/auth/LoginModal';
import { AppShell } from './components/layout/AppShell';
import { IntroVideo } from './components/intro/IntroVideo';
import { Toaster } from 'sonner';
import { TrashProvider } from './contexts/TrashContext';

export function MasakulaSystem() {
  // Authenticated User Session
  const [userSession, setUserSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('masakula_user_session_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return {
      email: 'admin@masakula.co.ao',
      name: 'Administrador Master',
      role: 'Administrador Master',
      terminalId: 'Caixa 01 - Balcão Principal',
      isLoggedIn: true,
    };
  });

  // Navigation State Machine - Direct entry to App Shell
  const [flowState, setFlowState] = useState<AppFlowState>(() => {
    try {
      const saved = localStorage.getItem('masakula_user_session_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isLoggedIn === false) return 'LOGIN';
      }
    } catch (e) {
      console.warn(e);
    }
    return 'APP_SHELL';
  });

  // Save session state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('masakula_user_session_v1', JSON.stringify(userSession));
    } catch (e) {
      console.warn(e);
    }
  }, [userSession]);

  // State Machine Handlers
  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    setFlowState('APP_SHELL');
  };

  const handleLogout = () => {
    setUserSession(prev => ({ ...prev, isLoggedIn: false }));
    setFlowState('LOGIN');
  };

  return (
    <TrashProvider>
      <div id="masakula-root-entry" className="min-h-screen bg-zinc-950 font-sans antialiased selection:bg-zinc-900 selection:text-white">
        <AnimatePresence mode="wait">
          {flowState === 'INTRO' && (
            <motion.div
              key="intro"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-screen w-full"
            >
              <IntroVideo onFinish={() => setFlowState('LOGIN')} />
            </motion.div>
          )}

          {flowState === 'LOGIN' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-screen w-full bg-[#f8f9fa]"
            >
              <LoginModal onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          )}

          {flowState === 'APP_SHELL' && (
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen w-full"
            >
              <AppShell userSession={userSession} onLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuração do Toaster centralizado na base inferior para não cobrir botões de ação */}
        <Toaster
          position="bottom-center"
          theme="dark"
          closeButton
          richColors
          duration={2500}
        />
      </div>
    </TrashProvider>
  );
}

export default MasakulaSystem;
