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

/**
 * `SURFACE_RADIUS` cobre cards, papers e diálogos; `CONTROL_RADIUS` fica
 * sempre um degrau abaixo, para botões, inputs, toggles e ladrilhos de ícone
 * (docs/design-system.md §2).
 */
export const SURFACE_RADIUS = 12;
export const CONTROL_RADIUS = 8;

// Rótulo correto por §1.3 do design system: branco no claro e
// rgba(0,0,0,0.87) no escuro para toda cor de estado, exceto warning, que é
// preto nos dois modos.
const stateContrastText = (mode: PaletteMode) =>
  mode === 'light' ? '#FFFFFF' : 'rgba(0, 0, 0, 0.87)';
const WARNING_CONTRAST_TEXT = 'rgba(0, 0, 0, 0.87)';

const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#2771CA' : '#3987e5',
      contrastText: stateContrastText(mode),
    },
    secondary: {
      main: mode === 'light' ? '#4a3aa7' : '#9085e9',
      contrastText: stateContrastText(mode),
    },
    success: {
      main: mode === 'light' ? '#0a7d0a' : '#0ca30c',
      contrastText: stateContrastText(mode),
    },
    // Só preenchimento — nunca texto (docs/design-system.md §1.4): #fab219
    // dá 1.70:1 sobre papel claro.
    warning: {
      main: '#fab219',
      contrastText: WARNING_CONTRAST_TEXT,
    },
    error: {
      main: mode === 'light' ? '#CF3939' : '#D85B5B',
      contrastText: stateContrastText(mode),
    },
    info: {
      main: mode === 'light' ? '#0F7C91' : '#1190A9',
      contrastText: stateContrastText(mode),
    },
    background:
      mode === 'light'
        ? { default: '#F4F6FB', paper: '#FFFFFF' }
        : { default: '#10131C', paper: '#181C27' },
    divider: mode === 'light' ? '#E4E8F1' : '#2A2F3D',
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
    borderRadius: SURFACE_RADIUS,
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: mode === 'light' ? '#c1c1c1 #f4f6fb' : '#3a3f4d #10131c',
          fontVariantNumeric: 'tabular-nums',
        },
        '*:focus-visible': {
          outline: `2px solid ${mode === 'light' ? '#2771CA' : '#3987e5'}`,
          outlineOffset: 2,
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            transitionDuration: '0.01ms !important',
          },
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
          border: '1px solid',
          borderColor: mode === 'light' ? '#E4E8F1' : '#2A2F3D',
          boxShadow:
            mode === 'light' ? '0 1px 2px rgba(16, 24, 40, 0.04)' : '0 1px 2px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderBottom: '1px solid',
          borderColor: mode === 'light' ? '#E4E8F1' : '#2A2F3D',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: CONTROL_RADIUS,
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
