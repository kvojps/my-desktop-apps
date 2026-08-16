import { PaletteMode, ThemeOptions, createTheme } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

/**
 * Dígitos de largura fixa. Aplicado onde valores em reais aparecem empilhados
 * (colunas, tabelas, listas) para que as casas decimais alinhem verticalmente.
 * As variantes de título já trazem isso pelo tema; use este `sx` nos textos de
 * corpo (body2/caption/células de tabela) que carregam dinheiro.
 */
export const tabularNums: SxProps<Theme> = { fontVariantNumeric: 'tabular-nums' };

/**
 * Consultas sobre a faixa de conteúdo (o container nomeado em `Layout`), e não
 * sobre a janela. Um breakpoint do MUI erra por ~156px aqui — é o que o rail, o
 * padding do Container e a barra de rolagem cobram —, então `md` acaba valendo
 * quando o conteúdo tem menos de 800px. Use estes limiares onde a densidade do
 * layout depende do espaço disponível de verdade.
 *
 * Larguras medidas: janela mínima (960) = 790px; padrão (1280) = 1110px.
 */
export const contentQuery = {
  /** Cabem colunas auxiliares além do essencial. */
  medium: '@container content (min-width: 640px)',
  /** Cabe a lista densa completa, com categoria em coluna própria. */
  wide: '@container content (min-width: 1000px)',
} as const;

/** Grade de cards que reage à largura real, sem depender de breakpoints. */
export const cardGrid = (min: number): SxProps<Theme> => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`,
});

const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#2a78d6' : '#3987e5',
    },
    secondary: {
      main: mode === 'light' ? '#4a3aa7' : '#9085e9',
    },
    // Status colors (paid/pending/overdue) — validated for CVD separation and
    // surface contrast; never reused for decorative/categorical purposes.
    // Green is the one that shifts per mode: no single value passes WCAG AA
    // both as a filled chip and as text over the mode's surface, because the
    // two uses pull luminance in opposite directions.
    //   light: white on #0a7d0a = 5.32:1, and #0a7d0a as text on paper = 5.32:1
    //   dark:  87% black on #0ca30c = 5.64:1, and #0ca30c as text on paper = 5.07:1
    success: {
      main: mode === 'light' ? '#0a7d0a' : '#0ca30c',
      contrastText: mode === 'light' ? '#fff' : 'rgba(0, 0, 0, 0.87)',
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
    // Títulos carregam quase todo o dinheiro do app (saldos, valores dos cards,
    // stat tiles), então a numeração tabular entra direto na variante.
    h3: { fontVariantNumeric: 'tabular-nums' },
    h4: { fontWeight: 700, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' },
    h5: { fontWeight: 700, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' },
    h6: { fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
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
    MuiAccordion: {
      defaultProps: {
        disableGutters: true,
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${mode === 'light' ? '#E4E8F1' : '#2A2F3D'}`,
          boxShadow:
            mode === 'light' ? '0 1px 2px rgba(16, 24, 40, 0.04)' : '0 1px 2px rgba(0, 0, 0, 0.2)',
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 72,
          padding: '0 20px',
          '&.Mui-expanded': {
            minHeight: 72,
          },
        },
        content: {
          margin: '16px 0',
          '&.Mui-expanded': {
            margin: '16px 0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '4px 20px 20px',
        },
      },
    },
  },
});

export const getAppTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
