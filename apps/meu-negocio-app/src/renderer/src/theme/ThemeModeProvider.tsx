import { ReactNode, useLayoutEffect, useState } from 'react';
import type { ThemeMode } from '@shared/types/theme';
import { api } from '@/api/client';
import { ThemeModeContext } from './themeModeContext';
import { getThemeVariables } from './index';

/**
 * Cache do renderer, não a fonte da verdade — essa é o banco, porque o processo
 * main precisa do modo para pintar a janela antes de existir renderer. Só serve
 * de reserva para quando o valor injetado não chega (preload indisponível).
 */
function getInitialMode(): ThemeMode {
  const injected = api.initialThemeMode();
  if (injected) return injected;

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Publica o modo de duas formas, porque ele tem dois consumidores de natureza
 * diferente: as variáveis `--negocio-*`, que a folha lê, e o `color-scheme`,
 * que é o que faz o próprio Chromium pintar barra de rolagem, campo nativo e
 * `<option>` no modo certo — nenhuma regra CSS nossa alcança essas superfícies.
 * Não há mais tema de biblioteca nem reset por baixo: a base do documento é
 * declarada em `styles.css` (docs/orca-theme.md).
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      // Sem `showError`: este provider mora fora do `App`, e portanto fora do
      // `SnackbarProvider`. Se a gravação falhar, a sessão mantém o modo novo e
      // o próximo boot volta ao antigo — um banco que não escreve vai aparecer
      // como `ErrorState` no primeiro carregamento de dados, de qualquer forma.
      api.setThemeMode(next).catch((err) => console.error('[theme] falha ao persistir', err));
      return next;
    });
  };

  // Os tokens vão em `<html>`, e não num `div` do React: menu de ações, menu
  // de status, popover de período e dica saem em portal para o `body`, e num
  // `div` as variáveis não os alcançariam — o menu nascia sem fundo.
  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(getThemeVariables(mode))) {
      root.style.setProperty(key, value as string);
    }
    root.style.colorScheme = mode;
    root.dataset.theme = mode;
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>{children}</ThemeModeContext.Provider>
  );
}
