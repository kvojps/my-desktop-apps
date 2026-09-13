import type { PaletteMode } from '@mui/material';

/**
 * Cor de identidade de um bloco — o preenchimento do `IconTile`, do
 * `StatusChip` e, por herança, a linha do ano do `StatCard`. Mora no tema, e
 * não no componente, porque é cor: quem consome pede o acento pelo nome.
 */
export type TileAccent = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';

/**
 * As matizes de identidade dos indicadores, preservadas da base anterior: elas
 * são o que faz o mesmo indicador se reconhecer entre as telas, e a migração é
 * de apresentação, não de significado. Como preenchimento, âmbar é legítimo
 * (§1.4) — o que ele nunca pode ser é texto.
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
 * estado do tema tem par por modo e contraste conhecido, e recalculá-lo em
 * runtime só criaria uma segunda fonte da verdade (§1.8). Medir é para o
 * preenchimento que o app não escolheu — a cor de categoria —, e essa continua
 * passando por `labelOn`. Âmbar é preto nos dois modos porque é claro nos dois.
 */
const TILE_LABEL: Record<TileAccent, { light: string; dark: string }> = {
  primary: { light: WHITE, dark: BLACK_87 },
  secondary: { light: WHITE, dark: BLACK_87 },
  success: { light: WHITE, dark: BLACK_87 },
  info: { light: WHITE, dark: BLACK_87 },
  warning: { light: BLACK_87, dark: BLACK_87 },
  error: { light: WHITE, dark: BLACK_87 },
};

/**
 * As duas cores de um acento, como referências aos tokens do modo corrente.
 * Quem preenche uma superfície com identidade pede as duas juntas: preenchê-la
 * sem trocar o rótulo é como o contraste se perde.
 */
export function tileColors(accent: TileAccent) {
  return {
    fill: `var(--money-tile-${accent})`,
    label: `var(--money-tile-${accent}-label)`,
  };
}

/**
 * O preenchimento de um acento **resolvido**, e não como `var()`.
 *
 * Quem desenha em CSS pede `tileColors`; quem desenha no Recharts pede isto.
 * Traço e preenchimento de uma marca do Recharts são atributos de apresentação,
 * e atributo de apresentação não resolve `var()` — a série sairia sem cor
 * nenhuma. É a mesma razão pela qual o `spark` do `StatCard` desce por
 * `currentColor`; lá há um elemento pai onde pendurar a cor, num eixo ou numa
 * barra não há.
 */
export function tileFill(accent: TileAccent, mode: PaletteMode): string {
  return TILE_FILL[accent][mode];
}

/**
 * O cinza das duas categorias que o **app** nomeia: "Sem categoria" e "Outras
 * categorias". As demais cores de categoria são do usuário.
 *
 * Ele era `#9AA0A6`, que a §1.7 lista como falha no claro — 2,64:1 contra o
 * papel branco, abaixo dos 3:1 de objeto gráfico. Os dez swatches são
 * oferecidos ao usuário porque a cor da categoria dele é dele; estes dois não
 * têm usuário a quem atribuir a escolha, então valem a regra estreita da §1.7 e
 * saem da lista que passa nos dois modos: `#757575` mede 4,61:1 no claro e
 * 3,89:1 no escuro.
 */
export const CATEGORY_NEUTRAL = '#757575';

/**
 * A cor de uma linha de categoria: a que o usuário cadastrou, ou o neutro
 * quando quem nomeia a linha é o app.
 *
 * Mora aqui, e não no módulo que monta as linhas, porque aquele é puro e não
 * conhece cor; e mora num lugar só porque a regra tem dois consumidores — a
 * barra do gráfico e o ponto da tabela —, e cores diferentes fariam as duas
 * leituras do mesmo dado parecerem coisas diferentes.
 */
export function categoryColor(color: string | null): string {
  return color ?? CATEGORY_NEUTRAL;
}

/**
 * Os valores do modo, antes de virarem variáveis CSS.
 *
 * Existe separado de `getOrcaVariables` porque nem todo consumidor é CSS: o
 * tema de gráfico precisa dos mesmos valores **resolvidos** (ver `tileFill`), e
 * lê-los daqui é o que impede a paleta de ter duas fontes da verdade.
 */
export function orcaColors(mode: PaletteMode) {
  const light = mode === 'light';

  return {
    background: light ? '#ffffff' : '#0a0a0a',
    paper: light ? '#ffffff' : '#171717',
    sidebar: light ? '#fafafa' : '#171717',
    foreground: light ? '#0a0a0a' : '#fafafa',
    muted: light ? '#666666' : '#a1a1a1',
    accent: light ? '#f5f5f5' : '#262626',
    border: light ? '#e5e5e5' : '#272727',
    // A borda do campo não é decorativa como a das superfícies: dentro de um
    // diálogo o campo tem exatamente o fundo do papel, e ela é a única coisa
    // que diz onde se digita. Por isso vale os 3:1 de objeto gráfico contra a
    // pior superfície que ela encontra — 3,19:1 sobre o fundo da faixa de
    // conteúdo no claro, 3,36:1 sobre o papel no escuro —, e não o cinza de
    // contorno de card.
    fieldBorder: light ? '#8a8a8a' : '#6b6b6b',
    focus: light ? '#2771ca' : '#3987e5',
    primary: light ? '#0a0a0a' : '#fafafa',
    onPrimary: light ? '#fafafa' : '#0a0a0a',
    danger: light ? '#b42318' : '#ff8a80',
    // O rótulo sobre o botão destrutivo, declarado junto do preenchimento como
    // todo par desta base (§1.8): 6,62:1 no claro e 7,98:1 no escuro.
    onDanger: light ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
    // Par por modo do valor em bom estado. Não é o preenchimento verde do
    // ladrilho: aquele é marca, este é texto, e texto cobra 4,5:1 (§1.1).
    positive: light ? '#067306' : '#35c435',
  };
}

/** Tokens das superfícies migradas; MUI mantém sua paleta até a migração da tela. */
export function getOrcaVariables(mode: PaletteMode): Record<string, string> {
  const light = mode === 'light';
  const color = orcaColors(mode);

  const tiles: Record<string, string> = {};
  for (const accent of Object.keys(TILE_FILL) as TileAccent[]) {
    tiles[`--money-tile-${accent}`] = tileFill(accent, mode);
    tiles[`--money-tile-${accent}-label`] = light
      ? TILE_LABEL[accent].light
      : TILE_LABEL[accent].dark;
  }

  return {
    '--money-background': color.background,
    '--money-paper': color.paper,
    '--money-sidebar': color.sidebar,
    '--money-foreground': color.foreground,
    '--money-muted': color.muted,
    '--money-accent': color.accent,
    '--money-border': color.border,
    '--money-field-border': color.fieldBorder,
    '--money-focus': color.focus,
    '--money-primary': color.primary,
    '--money-on-primary': color.onPrimary,
    '--money-danger': color.danger,
    '--money-positive': color.positive,
    '--money-on-danger': color.onDanger,
    // O ladrilho é medido em dois lugares — o quadrado e o esqueleto que
    // reserva o espaço dele —, então o tamanho é token e não literal.
    '--money-tile-size': '38px',
    '--money-font': '"Geist", system-ui, sans-serif',
    '--money-mono': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    ...tiles,
  };
}
