import { PaletteMode, ThemeOptions, createTheme } from '@mui/material';

/**
 * Caminhos, hashes e nomes de branch são metade do conteúdo do app. O
 * `monospace` genérico cai no Courier New no Windows, então a fonte vai
 * empacotada e declarada, com os monoespaçados de sistema como fallback.
 *
 * Uso: `fontFamily="mono"` — o sx resolve a chave pelo tema.
 */
const MONO_FONT_FAMILY = '"JetBrains Mono", "Cascadia Code", Consolas, "SF Mono", Menlo, monospace';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    mono: string;
  }
  interface TypographyVariantsOptions {
    mono?: string;
  }
}

const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#2a78d6' : '#3987e5',
    },
    secondary: {
      main: mode === 'light' ? '#4a3aa7' : '#9085e9',
    },
    // Cores fixas de status — mesmo valor nos dois modos, validadas para
    // separação CVD e contraste; nunca reutilizar para fins decorativos.
    success: {
      main: '#0ca30c',
    },
    warning: {
      main: '#fab219',
    },
    error: {
      main: '#d03b3b',
    },
    background:
      mode === 'light'
        ? { default: '#F4F6FB', paper: '#FFFFFF' }
        : { default: '#10131C', paper: '#181C27' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    mono: MONO_FONT_FAMILY,
    h4: { fontWeight: 700, letterSpacing: -0.5 },
    h5: { fontWeight: 700, letterSpacing: -0.3 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: mode === 'light' ? '#c1c1c1 #f4f6fb' : '#3a3f4d #10131c',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${mode === 'light' ? '#E4E8F1' : '#2A2F3D'}`,
          boxShadow:
            mode === 'light' ? '0 1px 2px rgba(16, 24, 40, 0.04)' : '0 1px 2px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${mode === 'light' ? '#E4E8F1' : '#2A2F3D'}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

export const getAppTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
