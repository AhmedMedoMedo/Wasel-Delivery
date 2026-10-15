import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Auto-cache busting & Service Worker cleaner: ensures mobile Chrome & Safari never trap old assets
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        caches.delete(key);
      }
    });
  }

  // Auto-reload on new version: checks if GitHub Pages has a newer build hash in index.html
  const checkNewVersion = async () => {
    try {
      const currentScript = Array.from(document.querySelectorAll('script[src]'))
        .map((s) => (s as HTMLScriptElement).src)
        .find((src) => src.includes('index-') && src.endsWith('.js'));
      if (!currentScript) return;

      const res = await fetch(`./index.html?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const htmlText = await res.text();
      const match = htmlText.match(/src="[^"]*index-([a-zA-Z0-9_-]+)\.js"/);
      if (match && !currentScript.includes(match[1])) {
        window.location.reload();
      }
    } catch {
      // Ignore network errors during silent check
    }
  };

  setTimeout(checkNewVersion, 2000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkNewVersion();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
