import { useMemo } from 'react';
import type { PlanPlacement } from '@shared/types/plan';
import { formatDimensions } from '@/utils/format';
import { type PieceLabel, fitPieceLabels } from './pieceLabels';
import { type PlanPiece, pieceIdentity } from './planLegend';
import { useTextMeasure } from './textMeasure';

/**
 * O rótulo de cada peça de uma chapa, já decidido contra o retângulo em que ele
 * seria escrito.
 *
 * Junta as três partes que o desenho não deveria ter de juntar sozinho: os
 * textos candidatos, o medidor do DOM e a regra dos três degraus. Existe como
 * hook, e não como código dentro do componente, porque há **três** desenhos — o
 * da tela, o da folha e o da imagem exportada —, e eles precisam decidir
 * igual. A escala é o que os separa, e é o único parâmetro que cada um traz de si.
 */
export function usePieceLabels(
  placements: readonly PlanPlacement[],
  pieces: readonly PlanPiece[],
  scale: number,
): PieceLabel[] {
  const measure = useTextMeasure();

  return useMemo(
    () =>
      fitPieceLabels(
        placements.map((placement, index) => ({
          lengthTenthsMm: placement.lengthTenthsMm,
          widthTenthsMm: placement.widthTenthsMm,
          identity: pieceIdentity(pieces[index]),
          number: String(pieces[index].number),
          // A medida escrita é a da peça **como ela foi desenhada**: numa peça
          // girada, a medida cadastrada contradiria o retângulo que está à
          // vista, e quem confere o plano confere contra o desenho.
          measure: formatDimensions(placement.lengthTenthsMm, placement.widthTenthsMm),
        })),
        { scale, measureTextWidth: measure.measureTextWidth },
      ),
    [measure, pieces, placements, scale],
  );
}
