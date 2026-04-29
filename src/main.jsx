import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register';
import './index.css'
import App from './App.jsx'
import useStore from './store/useStore'

// Initialize Firebase Auth Listener
useStore.getState().initAuth();

// One-time cleanup for SaaS migration
if (!localStorage.getItem('v2_cleaned')) {
  localStorage.clear();
  localStorage.setItem('v2_cleaned', 'true');
}

// Register PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.warn('[PWA] Update available, reloading...');
    window.location.reload();
  },
  onOfflineReady() {
    console.log('[PWA] Ready for offline use');
  },
});

// Handle ChunkLoadErrors (happens after new deployments)
window.addEventListener('error', (e) => {
  if (e.message?.includes('Failed to fetch dynamically imported module') || 
      e.message?.includes('ChunkLoadError')) {
    console.warn('[System] Deployment detected, reloading for update...');
    window.location.reload();
  }
}, true);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
