import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { App } from './App';
import { ThemeModeProvider } from './theme/ThemeModeProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    </HashRouter>
  </React.StrictMode>,
);
