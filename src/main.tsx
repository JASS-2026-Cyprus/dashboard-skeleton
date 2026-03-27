import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';
import { loadConfig } from './config';

loadConfig()
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error) => {
    console.error('Failed to load config:', error);
    document.body.innerHTML = '<h1>Error loading configuration</h1>';
  });
