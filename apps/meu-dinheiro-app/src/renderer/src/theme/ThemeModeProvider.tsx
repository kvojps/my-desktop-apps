import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import type { ThemeMode } from '@shared/types/theme';
import { api } from '@/api/client';
import { ThemeModeContext } from './themeModeContext';
import { getOrcaVariables } from './orca';

function getInitialMode(): ThemeMode {
  return (
    api.initialThemeMode() ??
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  const currentMode = useRef(mode);
  const toggleMode = () => {
    const next = currentMode.current === 'light' ? 'dark' : 'light';
    currentMode.current = next;
    setMode(next);
    api.setThemeMode(next).catch((err) => console.error('[theme] falha ao persistir', err));
  };

  // O provider publica o modo de duas formas, porque ele tem dois consumidores
  // de natureza diferente: as variáveis `--money-*`, que a folha de estilo lê,
  // e o `color-scheme`, que é o que faz o próprio Chromium pintar barra de
  // rolagem, campo nativo e `<option>` no modo certo — nenhuma regra CSS nossa
  // alcança essas superfícies.
  useLayoutEffect(() => {
    for (const [key, value] of Object.entries(getOrcaVariables(mode))) {
      document.documentElement.style.setProperty(key, value);
    }
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>{children}</ThemeModeContext.Provider>
  );
}
