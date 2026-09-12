import type { ThemeMode } from '@shared/types/theme';
import { createContext } from 'react';

export type { ThemeMode };

export interface ThemeModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);
