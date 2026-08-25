import { PaletteMode } from '@mui/material';
import { createContext } from 'react';

export interface ThemeModeContextValue {
  mode: PaletteMode;
  /**
   * O alternador do rail, onde o controle é um botão só e o modo atual está à
   * vista no próprio ícone.
   */
  toggleMode: () => void;
  /**
   * O modo escolhido pelo nome. A tela de Configurações oferece os dois lados
   * como opções nomeadas, e ali "alternar" não tem alvo: quem clica em "Claro"
   * está pedindo claro, não o contrário do que está.
   */
  setMode: (mode: PaletteMode) => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);
