import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async'; // ✅ NEW
import App from './App.tsx';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>   {/* ✅ NEW: enables SEO meta tags */}
      <App />
    </HelmetProvider>
  </StrictMode>
);