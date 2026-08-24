/**
 * Quanto de um rótulo cabe dentro da peça desenhada, decidido por **medição**:
 * o texto real, na fonte real, contra o retângulo real.
 *
 * São três degraus, e não dois. "Rótulo e medida quando cabem, senão o número"
 * não cobre a peça pequena demais para o próprio número — e ela existe: uma
 * peça de 30 × 15 mm numa chapa de 2750 desenhada em 800 px tem 9 px de lado.
 * O terceiro degrau é não escrever nada, e quem identifica a peça ali é o que
 * está fora do retângulo: a legenda ao lado do desenho, na tela, e a lista de
 * peças da página de resumo, no papel.
 *
 * O medidor entra por parâmetro porque ele é do DOM e o degrau não é. O que
 * isso compra não é só testabilidade: a tela e a folha desenham em escalas
 * diferentes — na folha o desenho é bem maior — e decidem pela **mesma** regra.
 * Dois cálculos escreveriam coisas diferentes sobre o mesmo plano, e quem está
 * com o papel na mão confere contra a tela.
 *
 * Módulo sem import de runtime, como o `planLegend` ao lado: é o que o mantém
 * ao alcance da suíte, que cobre lógica pura e não resolve os aliases do app.
 */
import type { Rectangle } from '@shared/types/rectangle';

/** Tamanho do rótulo dentro da peça, em pixel — o `caption` do tema. */
export const LABEL_FONT_PX = 12;

/** Altura de uma linha de rótulo, em pixel. */
export const LABEL_LINE_PX = LABEL_FONT_PX * 1.25;

/** Folga entre o rótulo e a borda da peça, em pixel. */
const LABEL_PADDING_PX = 4;

/** O que uma peça mostra dentro do próprio retângulo, depois de medido o texto. */
export type PieceLabel =
  // `identity` é o par número/rótulo — "3. Lateral"; `number` é só o número, que
  // é para onde o rótulo recua. Campos diferentes de propósito: um nome só para
  // as duas coisas faria o degrau desaparecer de quem lê o desenho.
  | { kind: 'full'; identity: string; measure: string }
  | { kind: 'number'; number: string }
  | { kind: 'none' };

/**
 * O retângulo desenhado e os dois textos candidatos a ele. `identity` é o par
 * número/rótulo e `measure` é a medida **como a peça foi desenhada** — numa
 * peça girada, a medida cadastrada contradiria o retângulo à vista.
 */
export interface LabelCandidate extends Rectangle {
  identity: string;
  /** Só o número da peça, que é o degrau para onde o rótulo recua. */
  number: string;
  measure: string;
}

export interface LabelFitting {
  /**
   * Pixel por décimo de milímetro: a razão com que o desenho é pintado. Zero é
   * a caixa ainda sem medida — nada é escrito, porque não há tamanho contra o
   * que comparar.
   */
  scale: number;
  /** Largura do texto em pixel, na fonte e no tamanho em que ele será escrito. */
  measureTextWidth: (text: string) => number;
}

export function fitPieceLabels(
  candidates: readonly LabelCandidate[],
  { scale, measureTextWidth }: LabelFitting,
): PieceLabel[] {
  if (scale <= 0) return candidates.map(() => ({ kind: 'none' }));

  // Tudo vem para a unidade do desenho: o retângulo está em décimo de
  // milímetro, e é contra ele que o texto — medido em pixel — é comparado.
  const padding = LABEL_PADDING_PX / scale;
  const lineHeight = LABEL_LINE_PX / scale;
  const widthOf = (text: string) => measureTextWidth(text) / scale;

  return candidates.map((candidate) => {
    const room = {
      length: candidate.lengthTenthsMm - 2 * padding,
      width: candidate.widthTenthsMm - 2 * padding,
    };

    if (
      Math.max(widthOf(candidate.identity), widthOf(candidate.measure)) <= room.length &&
      2 * lineHeight <= room.width
    ) {
      return { kind: 'full', identity: candidate.identity, measure: candidate.measure };
    }

    if (widthOf(candidate.number) <= room.length && lineHeight <= room.width) {
      return { kind: 'number', number: candidate.number };
    }

    return { kind: 'none' };
  });
}
