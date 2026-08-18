import { CssBaseline, PaletteMode, ThemeProvider } from '@mui/material';
import { ReactNode, useMemo, useState } from 'react';
import { api } from '@/api/client';
import { getAppTheme } from './index';
import { ThemeModeContext } from './themeModeContext';

/**
 * Cache do renderer, não a fonte da verdade — essa é o banco, porque o processo
 * main precisa do modo para pintar a janela antes de existir renderer. Só serve
 * de reserva para quando o valor injetado não chega (preload indisponível).
 */
const STORAGE_KEY = 'meu-dinheiro-theme-mode';

function getInitialMode(): PaletteMode {
  const injected = api.initialThemeMode();
  if (injected) return injected;

  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached === 'light' || cached === 'dark') return cached;

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      // Sem `showError`: este provider mora fora do `App`, e portanto fora do
      // `SnackbarProvider`. Se a gravação falhar, a sessão mantém o modo novo e
      // o próximo boot volta ao antigo — um banco que não escreve vai aparecer
      // como `ErrorState` no primeiro carregamento de dados, de qualquer forma.
      api.setThemeMode(next).catch((err) => console.error('[theme] falha ao persistir', err));
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
