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
export const SURFACE_RADIUS = 10;
export const CONTROL_RADIUS = 6;

// Rótulo correto por §1.3 do design system: branco no claro e
// rgba(0,0,0,0.87) no escuro para toda cor de estado, exceto warning, que é
// preto nos dois modos.
const stateContrastText = (mode: PaletteMode) =>
  mode === 'light' ? '#FFFFFF' : 'rgba(0, 0, 0, 0.87)';
const WARNING_CONTRAST_TEXT = 'rgba(0, 0, 0, 0.87)';

/**
 * Os valores do tema do piloto, num lugar só. A paleta MUI e as variáveis CSS
 * que o Tailwind consome são duas leituras da mesma tabela — quando estavam
 * escritas duas vezes, nada impedia que divergissem em silêncio.
 * Medições e procedência em `apps/git-dlog/docs/orca-theme.md`.
 */
const orcaTokens = (mode: PaletteMode) => {
  const light = mode === 'light';
  return {
    background: light ? '#ffffff' : '#0a0a0a',
    paper: light ? '#ffffff' : '#171717',
    sidebar: light ? '#fafafa' : '#171717',
    foreground: light ? '#0a0a0a' : '#fafafa',
    mutedForeground: light ? '#666666' : '#a1a1a1',
    accent: light ? '#f5f5f5' : '#262626',
    border: light ? '#e5e5e5' : 'rgba(255, 255, 255, 0.07)',
    focus: light ? '#2771CA' : '#3987e5',
    primary: light ? '#2771CA' : '#3987e5',
    secondary: light ? '#4a3aa7' : '#9085e9',
    success: light ? '#0a7d0a' : '#0ca30c',
    danger: light ? '#CF3939' : '#D85B5B',
    info: light ? '#0F7C91' : '#1190A9',
    /** Só preenchimento — nunca texto (design system §1.4): 1.70:1 sobre papel claro. */
    warning: '#fab219',
    onColor: stateContrastText(mode),
  };
};

const getDesignTokens = (mode: PaletteMode): ThemeOptions => {
  const orca = orcaTokens(mode);

  return {
    palette: {
      mode,
      primary: {
        main: orca.primary,
        contrastText: orca.onColor,
      },
      secondary: {
        main: orca.secondary,
        contrastText: orca.onColor,
      },
      success: {
        main: orca.success,
        contrastText: orca.onColor,
      },
      warning: {
        main: orca.warning,
        contrastText: WARNING_CONTRAST_TEXT,
      },
      error: {
        main: orca.danger,
        contrastText: orca.onColor,
      },
      info: {
        main: orca.info,
        contrastText: orca.onColor,
      },
      background: { default: orca.background, paper: orca.paper },
      text: {
        primary: orca.foreground,
        secondary: orca.mutedForeground,
      },
      divider: orca.border,
    },
    typography: {
      fontFamily: '"Geist", "Roboto", "Helvetica", "Arial", sans-serif',
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
          // Só os tokens que o CSS do piloto consome; o resto da paleta chega
          // pelo tema MUI. Documentados em `docs/orca-theme.md`.
          ':root': {
            '--dlog-paper': orca.paper,
            '--dlog-sidebar': orca.sidebar,
            '--dlog-foreground': orca.foreground,
            '--dlog-muted-foreground': orca.mutedForeground,
            '--dlog-accent': orca.accent,
            '--dlog-border': orca.border,
            '--dlog-focus': orca.focus,
            '--dlog-primary': orca.primary,
            '--dlog-danger': orca.danger,
            '--dlog-warning': orca.warning,
            '--dlog-on-color': orca.onColor,
            '--dlog-on-warning': WARNING_CONTRAST_TEXT,
            '--dlog-mono': MONO_FONT_FAMILY,
          },
          body: {
            scrollbarColor:
              mode === 'light' ? `#c1c1c1 ${orca.background}` : `#404040 ${orca.background}`,
            fontVariantNumeric: 'tabular-nums',
          },
          '*:focus-visible': {
            outline: `2px solid ${orca.focus}`,
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
            borderColor: orca.border,
            boxShadow:
              mode === 'light'
                ? '0 1px 2px rgba(16, 24, 40, 0.04)'
                : '0 1px 2px rgba(0, 0, 0, 0.2)',
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderBottom: '1px solid',
            borderColor: orca.border,
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
  };
};

export const getAppTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
