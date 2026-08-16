import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeModeProvider } from '@/theme/ThemeModeProvider';
import './styles.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    </HashRouter>
  </React.StrictMode>,
);
