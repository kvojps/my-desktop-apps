import { ReactNode, useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import { type ThemeMode, ThemeModeContext } from './themeModeContext';
import { getThemeVariables } from './index';

// Cache do renderer, não fonte da verdade — essa é o banco, lido pelo main
// antes de criar a janela (docs/design-system.md §5.1). `getInitialThemeMode`
// já reflete o banco: é o mesmo valor que decidiu a cor de fundo da janela.
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => api.getInitialThemeMode());

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      void api.saveThemeMode(next);
      return next;
    });
  };

  const variables = useMemo(() => getThemeVariables(mode), [mode]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    Object.entries(variables).forEach(([name, value]) =>
      root.style.setProperty(name, String(value)),
    );
  }, [mode, variables]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>{children}</ThemeModeContext.Provider>
  );
}
