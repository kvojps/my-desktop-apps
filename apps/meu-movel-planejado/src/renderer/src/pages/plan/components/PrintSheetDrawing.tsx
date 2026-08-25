import type { PlanSheet } from '@shared/types/plan';
import type { PlanPiece } from '../planLegend';
import { PRINT_DRAWING_MM, PRINT_DRAWING_PX } from '../printGeometry';
import { OffscreenSheetDrawing } from './OffscreenSheetDrawing';

/**
 * A chapa na folha: o desenho de fora da tela (`OffscreenSheetDrawing`) dentro da caixa
 * que a página reserva para ele.
 *
 * A caixa é declarada duas vezes, em milímetro para o CSS da folha e em pixel
 * para a escala do desenho, e as duas saem da mesma constante — é o que impede
 * um desenho de um tamanho medir o rótulo contra outro (`printGeometry`).
 */

interface PrintSheetDrawingProps {
  sheet: PlanSheet;
  /** Paralelo a `sheet.placements`: quem é cada retângulo. */
  pieces: PlanPiece[];
  /** O refile com que **este** plano foi gerado. */
  trimTenthsMm: number;
  /** A posição da chapa no plano, que dá o id da hachura desta folha. */
  index: number;
}

export function PrintSheetDrawing({ sheet, pieces, trimTenthsMm, index }: PrintSheetDrawingProps) {
  return (
    <div
      className="plan-print__drawing"
      style={{ height: `${PRINT_DRAWING_MM.height}mm`, width: `${PRINT_DRAWING_MM.width}mm` }}
    >
      <OffscreenSheetDrawing
        sheet={sheet}
        pieces={pieces}
        trimTenthsMm={trimTenthsMm}
        box={PRINT_DRAWING_PX}
        hatchId={`plan-print-hatch-${index}`}
      />
    </div>
  );
}
