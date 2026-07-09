import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker safely only when opened directly in browser (enables native PWA Install prompt)
if (typeof window !== 'undefined') {
  let isInsideIframe = false;
  try {
    isInsideIframe = window.self !== window.top;
  } catch (e) {
    isInsideIframe = true;
  }
  if (!isInsideIframe) {
    registerSW({ immediate: true });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
