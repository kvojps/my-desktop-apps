import { createContext } from 'react';
import type { ThemeMode } from '@shared/types/theme';

export interface ThemeModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);
