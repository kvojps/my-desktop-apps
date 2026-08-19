import { CssBaseline, PaletteMode, ThemeProvider } from '@mui/material';
import { ReactNode, useMemo, useState } from 'react';
import { api } from '@/api/client';
import { getAppTheme } from './index';
import { ThemeModeContext } from './themeModeContext';

// Cache do renderer, não fonte da verdade — essa é o banco, lido pelo main
// antes de criar a janela (docs/design-system.md §5.1). `getInitialThemeMode`
// já reflete o banco: é o mesmo valor que decidiu a cor de fundo da janela.
const STORAGE_KEY = 'git-dlog-theme-mode';

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() => api.getInitialThemeMode());

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      void api.saveThemeMode(next);
      return next;
    });
  };

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
