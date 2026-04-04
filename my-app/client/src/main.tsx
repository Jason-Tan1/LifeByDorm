import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n'; // Import i18n configuration
import './tailwind.css';

const CHUNK_RELOAD_KEY = 'vite:preload-reloaded';

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();

  const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
  if (!alreadyReloaded) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    window.location.reload();
    return;
  }

  // Avoid infinite reload loops if the error persists.
  console.error('Dynamic import failed after reload:', event);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Clear reload guard after a successful startup cycle.
setTimeout(() => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
}, 15000);
