import { PaletteMode, ThemeOptions, createTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { CSSProperties } from 'react';

/** Raio das superfícies (cards, papers, diálogos). */
export const SURFACE_RADIUS = 12;
/** Raio dos controles (botões, inputs, toggles), um degrau abaixo das superfícies. */
export const CONTROL_RADIUS = 8;

/**
 * Consultas sobre a faixa de conteúdo (o container nomeado em `Layout`), e não
 * sobre a janela. Um breakpoint do MUI erra por ~128px aqui — é o que o rail, o
 * padding do container e a barra de rolagem cobram —, então `md` acaba valendo
 * quando o conteúdo tem menos de 800px. Use estes limiares onde a densidade do
 * layout depende do espaço disponível de verdade.
 *
 * Larguras medidas: janela mínima (960) = 832px; padrão (1280) = 1152px.
 */
export const contentQuery = {
  /** Cabem colunas auxiliares além do essencial. */
  medium: '@container content (min-width: 640px)',
  /** Cabe a grade densa completa, com os gráficos lado a lado. */
  wide: '@container content (min-width: 1000px)',
} as const;

/**
 * Caminho de arquivo não é prosa: precisa de largura fixa por caractere para ser
 * conferido. A pilha é a do sistema — empacotar um arquivo de fonte para exibir
 * o caminho do banco custaria peso de instalador por nada (design system, §6).
 */
declare module '@mui/material/styles' {
  interface TypographyVariants {
    mono: CSSProperties;
  }
  interface TypographyVariantsOptions {
    mono?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    mono: true;
  }
}

const getDesignTokens = (mode: PaletteMode): ThemeOptions => {
  // Uma única borda para todas as superfícies: cards, papers com variant
  // "outlined", cabeçalhos e linhas de tabela saem daqui via palette.divider.
  const border = mode === 'light' ? '#E4E8F1' : '#2A2F3D';

  const primary = mode === 'light' ? '#2771CA' : '#3987e5';

  // As superfícies dos dois modos são distantes demais para que uma mesma cor
  // sirva de texto nos dois: no claro é preciso L <= 0.1658, no escuro
  // L >= 0.2277, e as janelas são disjuntas. Daí todo token de texto ter par
  // por modo — antes disto, success/error/info tinham valor único, e o valor
  // único era o do modo escuro exibido sobre papel branco.
  //
  // O rótulo sobre o preenchimento é o outro lado da mesma conta, e o limiar
  // automático do MUI é 3:1 — ele entrega branco sobre o verde escuro a 3.35:1
  // sem avisar, que é o que um `<Chip color="success">` renderizava aqui.
  const contrastText = mode === 'light' ? '#fff' : 'rgba(0, 0, 0, 0.87)';

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
      primary: { main: primary, contrastText },
      secondary: { main: mode === 'light' ? '#4a3aa7' : '#9085e9', contrastText },
      // success/error cobrem estoque e pagamento; info completa o conjunto de
      // status de pedido ("Em andamento") e é deliberadamente ciano para não se
      // confundir com o azul de primary, que é a cor de marca e de ação.
      success: { main: mode === 'light' ? '#0a7d0a' : '#0ca30c', contrastText },
      error: { main: mode === 'light' ? '#CF3939' : '#D85B5B', contrastText },
      info: { main: mode === 'light' ? '#0F7C91' : '#1190A9', contrastText },
      // Âmbar é o único token de valor único, porque é o único que nunca é
      // texto: como texto sobre papel claro daria 1.83:1. Ele preenche chip,
      // ladrilho e borda, e o rótulo sobre ele é preto nos dois modos (9.63:1).
      warning: { main: '#fab219', contrastText: 'rgba(0, 0, 0, 0.87)' },
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
      mono: {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '0.8125rem',
        wordBreak: 'break-all',
      },
    },
    shape: { borderRadius: SURFACE_RADIUS },
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
          // O anel default do MUI some contra as superfícies do modo escuro.
          // `:focus-visible` e não `:focus`: o anel no clique do mouse é ruído.
          '*:focus-visible': {
            outline: `2px solid ${primary}`,
            outlineOffset: 2,
          },
          // O MUI anima diálogo, snackbar e ripple por padrão. Desligar de uma
          // vez é mais barato e mais correto do que caçar animação a animação.
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
        styleOverrides: { root: { backgroundImage: 'none' } },
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
      // Configurações usa acordeão como estrutura de página, e é a extensão que
      // o design system prevê para isso (§6). Os valores são os mesmos do outro
      // app que já usa o padrão: mesma borda e mesma sombra dos cards, sem o
      // filete que o MUI desenha entre painéis vizinhos.
      MuiAccordion: {
        defaultProps: {
          disableGutters: true,
          elevation: 0,
        },
        styleOverrides: {
          root: {
            border: `1px solid ${border}`,
            boxShadow:
              mode === 'light'
                ? '0 1px 2px rgba(16, 24, 40, 0.04)'
                : '0 1px 2px rgba(0, 0, 0, 0.2)',
            '&:before': {
              display: 'none',
            },
          },
        },
      },
      // Altura travada em aberto e fechado: o cabeçalho é o que se lê com a
      // seção fechada, e ele não pode mudar de tamanho ao abrir.
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
      MuiButton: { styleOverrides: { root: { borderRadius: CONTROL_RADIUS } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: CONTROL_RADIUS } } },
      MuiToggleButton: { styleOverrides: { root: { borderRadius: CONTROL_RADIUS } } },
      // O grupo reaplica `shape.borderRadius` (o raio de superfície) nos filhos
      // das pontas, o que deixaria as quinas externas em 12 e as internas em 8.
      MuiToggleButtonGroup: {
        styleOverrides: {
          grouped: {
            '&:first-of-type': {
              borderTopLeftRadius: CONTROL_RADIUS,
              borderBottomLeftRadius: CONTROL_RADIUS,
            },
            '&:last-of-type': {
              borderTopRightRadius: CONTROL_RADIUS,
              borderBottomRightRadius: CONTROL_RADIUS,
            },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
      // O cabeçalho deixa de flutuar sobre a mesma superfície branca das linhas
      // e passa a ancorar a tabela — é a única faixa tonal fixa do app.
      MuiTableHead: { styleOverrides: { root: { backgroundColor: tint(0.06) } } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 600, whiteSpace: 'nowrap' } } },
      MuiTableBody: {
        styleOverrides: {
          root: {
            '& .MuiTableRow-root:nth-of-type(odd)': { backgroundColor: stripe },
            // Único azul entre as linhas, e por isso pode ser forte: é o que
            // diz "esta é a linha sob o cursor".
            '& .MuiTableRow-hover:hover': { backgroundColor: tint(0.1) },
          },
        },
      },
    },
  };
};

export const getAppTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
