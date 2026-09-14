import { PaletteMode, ThemeOptions, createTheme } from '@mui/material';
import type { CSSProperties } from 'react';
import type { ThemeMode } from '@shared/types/theme';

/** Raio das superfícies (cards, papers, diálogos). */
export const SURFACE_RADIUS = 10;
/** Raio dos controles (botões, inputs, toggles), um degrau abaixo das superfícies. */
export const CONTROL_RADIUS = 6;

/**
 * Cor de identidade de um indicador — o preenchimento do `IconTile`, do
 * `StatusChip` e do medidor de coluna. Mora no tema, e não no componente,
 * porque é cor: quem consome pede o acento pelo nome.
 */
export type TileAccent = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';

/**
 * As matizes de identidade, preservadas da base anterior: são o que faz o
 * mesmo indicador se reconhecer entre as telas, e a migração é de apresentação,
 * não de significado. Como preenchimento, âmbar é legítimo (§1.4) — o que ele
 * nunca pode ser é texto.
 */
const TILE_FILL: Record<TileAccent, { light: string; dark: string }> = {
  primary: { light: '#2771ca', dark: '#3987e5' },
  secondary: { light: '#4a3aa7', dark: '#9085e9' },
  success: { light: '#0a7d0a', dark: '#0ca30c' },
  info: { light: '#0f7c91', dark: '#1190a9' },
  warning: { light: '#fab219', dark: '#fab219' },
  error: { light: '#cf3939', dark: '#d85b5b' },
};

const WHITE = '#ffffff';
const BLACK_87 = 'rgba(0, 0, 0, 0.87)';

/**
 * O rótulo por cima de cada preenchimento, **declarado** e não medido: cor de
 * estado do tema tem par por modo e contraste conhecido (§1.8). Âmbar é preto
 * nos dois modos porque é claro nos dois.
 */
const TILE_LABEL: Record<TileAccent, { light: string; dark: string }> = {
  primary: { light: WHITE, dark: BLACK_87 },
  secondary: { light: WHITE, dark: BLACK_87 },
  success: { light: WHITE, dark: BLACK_87 },
  info: { light: WHITE, dark: BLACK_87 },
  warning: { light: BLACK_87, dark: BLACK_87 },
  error: { light: WHITE, dark: BLACK_87 },
};

/** O preenchimento de um acento resolvido, para quem desenha fora do CSS (Recharts). */
export function tileFill(accent: TileAccent, mode: ThemeMode): string {
  return TILE_FILL[accent][mode];
}

/**
 * Os valores do modo, antes de virarem variáveis CSS. Existe separado de
 * `getThemeVariables` porque o tema MUI, enquanto coexiste, lê os mesmos
 * valores resolvidos — duas leituras da mesma tabela, e não duas tabelas.
 * Medições e procedência em docs/orca-theme.md.
 */
export function orcaColors(mode: ThemeMode) {
  const light = mode === 'light';
  return {
    background: light ? '#ffffff' : '#0a0a0a',
    // A faixa de conteúdo é a superfície recuada sobre a qual os painéis
    // flutuam. No claro não pode ser `accent`: o esqueleto é preenchido com
    // ele e desenha direto sobre a faixa.
    content: light ? '#fafafa' : '#0a0a0a',
    paper: light ? '#ffffff' : '#171717',
    sidebar: light ? '#fafafa' : '#171717',
    foreground: light ? '#0a0a0a' : '#fafafa',
    muted: light ? '#666666' : '#a1a1a1',
    accent: light ? '#f5f5f5' : '#262626',
    border: light ? '#e5e5e5' : '#272727',
    // A borda do campo não é decorativa: dentro de um diálogo o campo tem o
    // fundo do papel, e ela é o único sinal de onde se digita — vale os 3:1 de
    // objeto gráfico contra a pior superfície que encontra.
    fieldBorder: light ? '#8a8a8a' : '#6b6b6b',
    scrollbar: light ? '#c1c1c1' : '#404040',
    focus: light ? '#2771ca' : '#3987e5',
    primary: light ? '#0a0a0a' : '#fafafa',
    onPrimary: light ? '#fafafa' : '#0a0a0a',
    danger: light ? '#b42318' : '#ff8a80',
    onDanger: light ? '#ffffff' : BLACK_87,
    // Par por modo do valor em bom estado. Não é o preenchimento verde do
    // ladrilho: aquele é marca, este é texto, e texto cobra 4,5:1 (§1.1).
    positive: light ? '#067306' : '#35c435',
  };
}

/** Tokens da base Orca local como variáveis CSS; valores e contraste em docs/orca-theme.md. */
export function getThemeVariables(mode: ThemeMode): CSSProperties {
  const color = orcaColors(mode);
  const tiles: Record<string, string> = {};
  for (const accent of Object.keys(TILE_FILL) as TileAccent[]) {
    tiles[`--negocio-tile-${accent}`] = TILE_FILL[accent][mode];
    tiles[`--negocio-tile-${accent}-label`] = TILE_LABEL[accent][mode];
  }
  return {
    '--negocio-background': color.background,
    '--negocio-content': color.content,
    '--negocio-paper': color.paper,
    '--negocio-sidebar': color.sidebar,
    '--negocio-foreground': color.foreground,
    '--negocio-muted-foreground': color.muted,
    '--negocio-accent': color.accent,
    '--negocio-border': color.border,
    '--negocio-field-border': color.fieldBorder,
    '--negocio-scrollbar': color.scrollbar,
    '--negocio-focus': color.focus,
    '--negocio-primary': color.primary,
    '--negocio-on-primary': color.onPrimary,
    '--negocio-danger': color.danger,
    '--negocio-on-danger': color.onDanger,
    '--negocio-positive': color.positive,
    // Âmbar é só preenchimento, e o rótulo sobre ele é preto nos dois modos.
    '--negocio-warning': TILE_FILL.warning[mode],
    '--negocio-on-warning': TILE_LABEL.warning[mode],
    '--negocio-font': '"Geist", system-ui, sans-serif',
    '--negocio-mono': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    ...tiles,
  } as CSSProperties;
}

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
  // Enquanto o MUI coexiste (até a issue 06), a paleta dele é uma leitura da
  // mesma tabela neutra da base nova: Dashboard e Configurações, ainda MUI,
  // não podem contradizer as telas migradas ao lado delas.
  const color = orcaColors(mode);
  const border = color.border;

  // As superfícies dos dois modos são distantes demais para que uma mesma cor
  // sirva de texto nos dois; daí todo token de texto ter par por modo. O rótulo
  // sobre o preenchimento é o outro lado da mesma conta, e o limiar automático
  // do MUI é 3:1 — ele entrega branco sobre o verde escuro a 3.35:1 sem avisar.
  const contrastText = mode === 'light' ? '#fff' : 'rgba(0, 0, 0, 0.87)';

  return {
    palette: {
      mode,
      // O azul continua sendo a cor de identidade e de foco; o botão primário
      // neutro é da base nova e só chega aos consumidores MUI na migração deles.
      primary: { main: tileFill('primary', mode), contrastText },
      secondary: { main: tileFill('secondary', mode), contrastText },
      success: { main: tileFill('success', mode), contrastText },
      error: { main: tileFill('error', mode), contrastText },
      info: { main: tileFill('info', mode), contrastText },
      // Âmbar é o único token de valor único, porque é o único que nunca é
      // texto: ele preenche chip, ladrilho e borda, e o rótulo sobre ele é
      // preto nos dois modos (9.63:1).
      warning: { main: tileFill('warning', mode), contrastText: 'rgba(0, 0, 0, 0.87)' },
      divider: border,
      text: { primary: color.foreground, secondary: color.muted },
      action: { hover: color.accent, selected: color.accent },
      background: { default: color.content, paper: color.paper },
    },
    typography: {
      fontFamily: '"Geist", system-ui, sans-serif',
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
            scrollbarColor: `${color.scrollbar} ${color.content}`,
            // O app é quase todo número: valores em real, quantidades e datas
            // empilhados em tabelas e grids de cards. Dígitos de largura fixa
            // fazem as colunas alinharem sozinhas, sem precisar tabular nada.
            fontVariantNumeric: 'tabular-nums',
          },
          // O anel default do MUI some contra as superfícies do modo escuro.
          // `:focus-visible` e não `:focus`: o anel no clique do mouse é ruído.
          '*:focus-visible': {
            outline: `2px solid ${color.focus}`,
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
      // A base migrada separa linhas por régua de 1px, sem zebra nem tinta azul:
      // o cabeçalho ancora a tabela sobre o `accent` neutro (docs/orca-theme.md).
      MuiTableHead: { styleOverrides: { root: { backgroundColor: color.accent } } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 600, whiteSpace: 'nowrap' } } },
      MuiTableBody: {
        styleOverrides: {
          root: {
            '& .MuiTableRow-hover:hover': { backgroundColor: color.accent },
          },
        },
      },
    },
  };
};

export const getAppTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
