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
 * A mesma matiz de identidade quando ela é **série de gráfico** ou o quadrado
 * de uma tag, desenhada direto sobre o papel: ali o que vale é o 3:1 de objeto
 * gráfico contra a superfície (§1.7), e o âmbar do ladrilho não passa no claro
 * (1,83:1 sobre `#ffffff`). O ladrilho não tem esse problema porque o que se
 * mede nele é o rótulo por cima; a barra não tem rótulo por cima — ela é o
 * objeto. Só o âmbar precisa de par; os outros cinco já passam nos dois papéis.
 * Medições em docs/orca-theme.md.
 */
/** O mesmo vocabulário de acentos, lido pela tabela de série e não pela do ladrilho. */
export type SeriesAccent = TileAccent;

const SERIES_FILL: Record<SeriesAccent, { light: string; dark: string }> = {
  ...TILE_FILL,
  warning: { light: '#b26f00', dark: '#fab219' },
};

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

/** O preenchimento de um acento resolvido, para quem desenha fora do CSS. */
export function tileFill(accent: TileAccent, mode: ThemeMode): string {
  return TILE_FILL[accent][mode];
}

/** A cor de série do acento — o que o Recharts pinta sobre o papel. */
export function seriesFill(accent: SeriesAccent, mode: ThemeMode): string {
  return SERIES_FILL[accent][mode];
}

/**
 * Os valores do modo, antes de virarem variáveis CSS. Existe separado de
 * `getThemeVariables` porque o tema de gráfico lê os mesmos valores
 * resolvidos, por prop — duas leituras da mesma tabela, e não duas tabelas.
 * O `background` é o que o processo main pinta na janela antes de existir
 * renderer (`WINDOW_BACKGROUND`, em `main/domain/theme.ts`); cada lado é
 * conferido contra a tabela de docs/orca-theme.md pelo teste ao seu lado —
 * `tokens.test.ts` aqui, `theme.test.ts` lá. Medições e procedência no mesmo
 * documento.
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
    tiles[`--negocio-series-${accent}`] = SERIES_FILL[accent][mode];
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
