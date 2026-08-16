import { PaletteMode, ThemeOptions, createTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

/** Raio das superfícies (cards, papers, diálogos). */
const SURFACE_RADIUS = 12;
/** Raio dos controles (botões, inputs, toggles), um degrau abaixo das superfícies. */
export const CONTROL_RADIUS = 8;

const getDesignTokens = (mode: PaletteMode): ThemeOptions => {
  // Uma única borda para todas as superfícies: cards, papers com variant
  // "outlined", cabeçalhos e linhas de tabela saem daqui via palette.divider.
  const border = mode === 'light' ? '#E4E8F1' : '#2A2F3D';

  const primary = mode === 'light' ? '#2a78d6' : '#3987e5';

  // Azul nas superfícies da tabela só onde ele significa alguma coisa: o
  // cabeçalho, que ancora a estrutura, e a linha sob o cursor. Linha azulada é
  // a convenção de "selecionada" — usá-la também na zebra fazia metade da
  // tabela parecer selecionada e apagava a diferença para o hover.
  const tint = (opacity: number) => alpha(primary, mode === 'light' ? opacity : opacity * 1.8);

  // A zebra é acromática de propósito: o trabalho dela é separar linhas longas
  // sem ser percebida como estado. No claro escurece o papel, no escuro clareia.
  const stripe = mode === 'light' ? alpha('#000000', 0.022) : alpha('#FFFFFF', 0.028);

  return {
    palette: {
      mode,
      primary: {
        main: primary,
      },
      secondary: {
        main: mode === 'light' ? '#4a3aa7' : '#9085e9',
      },
      // Cores de estado — mesmo valor nos dois modos, validadas para separação
      // sob CVD e contraste contra as superfícies. success/warning/error cobrem
      // estoque e pagamento; info completa o conjunto de status de pedido
      // ("Em andamento") e é deliberadamente ciano para não se confundir com o
      // azul de primary, que é a cor de marca e de ação.
      success: {
        main: '#0ca30c',
      },
      warning: {
        main: '#fab219',
      },
      error: {
        main: '#d03b3b',
      },
      info: {
        main: '#0f7f95',
      },
      divider: border,
      background:
        mode === 'light'
          ? { default: '#F4F6FB', paper: '#FFFFFF' }
          : { default: '#10131C', paper: '#181C27' },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
            // O app é quase todo número: valores em real, quantidades e datas
            // empilhados em tabelas e grids de cards. Dígitos de largura fixa
            // fazem as colunas alinharem sozinhas, sem precisar tabular nada.
            fontVariantNumeric: 'tabular-nums',
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
            border: `1px solid ${border}`,
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
            borderBottom: `1px solid ${border}`,
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
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: CONTROL_RADIUS,
          },
        },
      },
      MuiToggleButton: {
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
      // O cabeçalho deixa de flutuar sobre a mesma superfície branca das linhas
      // e passa a ancorar a tabela — é a única faixa tonal fixa do app.
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: tint(0.06),
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            whiteSpace: 'nowrap',
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            '& .MuiTableRow-root:nth-of-type(odd)': {
              backgroundColor: stripe,
            },
            // Único azul entre as linhas, e por isso pode ser forte: é o que
            // diz "esta é a linha sob o cursor".
            '& .MuiTableRow-hover:hover': {
              backgroundColor: tint(0.1),
            },
          },
        },
      },
    },
  };
};

export const getAppTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
