/**
 * A paleta categórica do app e a escolha do rótulo que vai por cima dela — as
 * §1.7 e §1.8 do design system, no código.
 *
 * As duas moram juntas porque são a mesma lista medida duas vezes: lá o swatch
 * contra o papel (limiar de 3:1, objeto gráfico), aqui o rótulo sobre o swatch
 * (limiar de 4,5:1, texto). Mudar a paleta obriga a refazer as duas contas, e
 * separá-las em dois arquivos é garantir que uma fique para trás.
 *
 * É o módulo de tema, e não o componente que desenha a chapa, porque conta que
 * decide contraste precisa ficar num lugar só, onde uma auditoria a encontre
 * (§1.8).
 */

/** Os dois rótulos possíveis: o branco do tema e o preto de 87% do `contrastText`. */
export const LABEL_WHITE = '#fff';
export const LABEL_BLACK = 'rgba(0, 0, 0, 0.87)';

/** Opacidade do rótulo preto. Ele compõe com o preenchimento, e a conta precisa saber disso. */
const BLACK_LABEL_ALPHA = 0.87;

/**
 * As cores das peças no desenho da chapa, agrupadas por dimensão.
 *
 * É a paleta categórica da §1.7 **menos** os swatches que não separam de um dos
 * dois papéis no limiar de 3:1: `#FB8C00` (2.37 no claro), `#00ACC1` (2.74 no
 * claro), `#7B1FA2` (2.04 no escuro) e o neutro `#9AA0A6` (2.64 no claro). Lá a
 * paleta inteira é oferecida porque **o usuário** escolhe a cor da categoria e
 * responde por ela; aqui quem escolhe é o app, e escolher um swatch que a
 * própria tabela marca como falha seria assinar a falha.
 *
 * Sete cores para um número de dimensões que não tem teto: acima disso a lista
 * dá a volta, e duas medidas dividem cor. É legível porque cor nunca é o único
 * canal (§1.7) — cada peça leva o número dela, e a legenda ao lado repete o
 * número junto da medida.
 */
export const CATEGORICAL_PALETTE: readonly string[] = [
  '#5C6BC0',
  '#1E88E5',
  '#E53935',
  '#43A047',
  '#D81B60',
  '#B85C38',
  '#757575',
];

/** Os três canais de um hex, de 0 a 1. Aceita `#abc` e `#aabbcc`, em qualquer caixa. */
function channels(hex: string): [number, number, number] {
  const digits = hex.replace('#', '');
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;
  return [0, 2, 4].map((start) => parseInt(full.slice(start, start + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

/** Luminância relativa da WCAG, a partir dos canais já em 0..1. */
function luminance([r, g, b]: [number, number, number]): number {
  const linear = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function ratio(a: number, b: number): number {
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Contraste WCAG entre duas cores **opacas**, ex. o swatch contra o papel. */
export function contrastRatio(a: string, b: string): number {
  return ratio(luminance(channels(a)), luminance(channels(b)));
}

/**
 * O contraste do rótulo preto sobre o preenchimento. Ele é 87% opaco, então
 * compõe com o que está atrás — e é essa composição que faz o ponto de virada
 * andar com a matiz em vez de ficar parado numa constante (§1.8).
 */
function blackLabelContrast(fill: string): number {
  const behind = channels(fill);
  const composed = behind.map((c) => c * (1 - BLACK_LABEL_ALPHA)) as [number, number, number];
  return ratio(luminance(composed), luminance(behind));
}

function whiteLabelContrast(fill: string): number {
  return contrastRatio(LABEL_WHITE, fill);
}

/**
 * A cor do rótulo sobre um preenchimento que o app não escolheu por modo:
 * mede os dois rótulos possíveis sobre ele e fica com o maior (§1.8).
 *
 * **Não é um limiar de luminância.** O limiar é a implementação tentadora, e o
 * que ele esconde é que a virada não é uma constante: `#787882` (L = 0.1904)
 * prefere branco e `#F00019` (L = 0.1860) prefere preto — as janelas se
 * sobrepõem, e nenhum valor separa os dois.
 */
export function labelOn(fill: string): string {
  return whiteLabelContrast(fill) >= blackLabelContrast(fill) ? LABEL_WHITE : LABEL_BLACK;
}

/** Quanto o rótulo escolhido de fato mede sobre o preenchimento. */
export function labelContrast(fill: string): number {
  return Math.max(whiteLabelContrast(fill), blackLabelContrast(fill));
}
