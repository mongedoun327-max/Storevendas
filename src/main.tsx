import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Registro automático e imediato do Service Worker para suporte PWA 100% Offline
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] Nova versão do Masakula POS pronta para atualização.');
    },
    onOfflineReady() {
      console.log('[PWA] Masakula POS 100% disponível para uso offline.');
    },
  });
}

// Prevenção de avisos benignos de WebSocket no ambiente de desenvolvimento
if (typeof window !== 'undefined') {
  const isIgnoredError = (err: unknown) => {
    const text = String((err as any)?.message || (err as any)?.reason || err || '');
    return text.includes('WebSocket') || text.includes('vite') || text.includes('closed without opened') || text.includes('Erro no processamento da imagem') || text.includes('staticimgly');
  };

  window.addEventListener('unhandledrejection', (e) => {
    if (isIgnoredError(e.reason)) {
      e.preventDefault();
      e.stopImmediatePropagation?.();
    }
  });

  window.addEventListener('error', (e) => {
    if (isIgnoredError(e.message) || isIgnoredError(e.error)) {
      e.preventDefault();
      e.stopImmediatePropagation?.();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

