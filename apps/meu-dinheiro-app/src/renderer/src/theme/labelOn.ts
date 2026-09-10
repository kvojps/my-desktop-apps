/**
 * A escolha do rótulo que vai por cima de um preenchimento colorido — a §1.8 do
 * design system, no código.
 *
 * Mora no módulo de tema, e não no componente que desenha a amostra, porque
 * conta que decide contraste precisa ficar num lugar só, onde uma auditoria a
 * encontre (§1.8). O preenchimento aqui é a cor de categoria que o usuário
 * escolheu em `CategoryForm` — o app não a escolheu por modo, então não há par a
 * consultar e a decisão é medida sobre o próprio preenchimento.
 */

/** Os dois rótulos possíveis: o branco do tema e o preto de 87% do `contrastText`. */
const LABEL_WHITE = '#fff';
const LABEL_BLACK = 'rgba(0, 0, 0, 0.87)';

/** Opacidade do rótulo preto. Ele compõe com o preenchimento, e a conta precisa saber disso. */
const BLACK_LABEL_ALPHA = 0.87;

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

function whiteLabelContrast(fill: string): number {
  return ratio(luminance(channels(LABEL_WHITE)), luminance(channels(fill)));
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

/**
 * A cor do rótulo sobre um preenchimento que o app não escolheu por modo: mede
 * os dois rótulos possíveis sobre ele e fica com o maior (§1.8).
 *
 * **Não é um limiar de luminância.** O limiar é a implementação tentadora, e o
 * que ele esconde é que a virada não é uma constante: `#787882` (L = 0.1904)
 * prefere branco e `#F00019` (L = 0.1860) prefere preto — as janelas se
 * sobrepõem, e nenhum valor separa os dois. O `0.4` que morava aqui errava por
 * uma distância enorme, devolvendo branco até para `#FB8C00` (2.37:1).
 */
export function labelOn(fill: string): string {
  return whiteLabelContrast(fill) >= blackLabelContrast(fill) ? LABEL_WHITE : LABEL_BLACK;
}
