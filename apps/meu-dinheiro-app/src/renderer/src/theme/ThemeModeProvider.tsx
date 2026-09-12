import { CssBaseline, PaletteMode, ThemeProvider } from '@mui/material';
import { ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/api/client';
import { ThemeModeContext } from './themeModeContext';
import { getAppTheme } from './index';
import { getOrcaVariables } from './orca';

function getInitialMode(): PaletteMode {
  return (
    api.initialThemeMode() ??
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  const currentMode = useRef(mode);
  const toggleMode = () => {
    const next = currentMode.current === 'light' ? 'dark' : 'light';
    currentMode.current = next;
    setMode(next);
    api.setThemeMode(next).catch((err) => console.error('[theme] falha ao persistir', err));
  };

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  useLayoutEffect(() => {
    for (const [key, value] of Object.entries(getOrcaVariables(mode))) {
      document.documentElement.style.setProperty(key, value);
    }
    document.documentElement.style.colorScheme = mode;
    document.documentElement.style.setProperty(
      '--mui-content-background',
      theme.palette.background.default,
    );
  }, [mode, theme]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
