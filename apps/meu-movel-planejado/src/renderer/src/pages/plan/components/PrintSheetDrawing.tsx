import { useId } from 'react';
import { usableArea } from '@shared/plan/usableArea';
import type { PlanPlacement, PlanSheet } from '@shared/types/plan';
import { LABEL_FONT_PX, LABEL_LINE_PX, type PieceLabel } from '../pieceLabels';
import type { PlanPiece } from '../planLegend';
import { PRINT_DRAWING_MM, PRINT_DRAWING_PX } from '../printGeometry';
import { usePieceLabels } from '../usePieceLabels';

/**
 * A mesma chapa do `SheetDrawing`, desenhada para o papel.
 *
 * É um segundo desenho, e não o primeiro com outro CSS, porque o papel muda o
 * que o desenho **é feito de**. Na tela a peça se distingue por preenchimento;
 * a impressora da oficina não tem colorido, e a matiz que ela joga fora era o
 * canal (§5.6). Aqui a peça é branca com contorno e número, a sobra é hachurada,
 * e o refile continua liso — a mesma distinção da tela, escrita em traço.
 *
 * Nada aqui consulta o tema. O que sai impresso sai sempre na versão clara,
 * qualquer que seja o modo em que o app está aberto: pintar isto com os tokens
 * do MUI mandaria cinza sobre cinza para a folha toda vez que o marceneiro
 * estivesse no escuro.
 *
 * A escala não é medida do DOM como na tela — ela é **calculada** a partir da
 * caixa da folha, que é conhecida antes de existir folha. Medir aqui daria
 * zero: nada em `display: none` tem largura, e o desenho sairia sem rótulo
 * nenhum.
 */

/** A folha é branca e a tinta é preta: o papel não tem tema (§5.6). */
const INK = '#000000';
const PAPER = '#ffffff';

/** Lado do ladrilho da hachura da sobra, em pixel — ~2 mm no papel. */
const HATCH_PX = 8;

/** Traço da hachura: fino o bastante para não fechar a região que ele marca. */
const HATCH_STROKE_PX = 0.6;

/** Contorno da chapa e da área útil. */
const OUTLINE_PX = 1;

/**
 * Contorno da peça, mais grosso que o da chapa. É ele que desenha a fronteira
 * entre duas peças vizinhas de mesma medida, que na tela a cor separava.
 */
const PIECE_OUTLINE_PX = 1.4;

interface PrintSheetDrawingProps {
  sheet: PlanSheet;
  /** Paralelo a `sheet.placements`: quem é cada retângulo. */
  pieces: PlanPiece[];
  /** O refile com que **este** plano foi gerado. */
  trimTenthsMm: number;
}

export function PrintSheetDrawing({ sheet, pieces, trimTenthsMm }: PrintSheetDrawingProps) {
  const hatchId = useId();

  // Cabe nos dois eixos da caixa da folha, sem esticar a proporção.
  const scale = Math.min(
    PRINT_DRAWING_PX.width / sheet.lengthTenthsMm,
    PRINT_DRAWING_PX.height / sheet.widthTenthsMm,
  );

  const labels = usePieceLabels(sheet.placements, pieces, scale);

  const hairline = OUTLINE_PX / scale;

  // O mesmo retângulo que a tela hachura, da mesma conta: é o denominador do
  // aproveitamento, e calculá-lo duas vezes o deixaria divergir entre os meios.
  const usable = usableArea(sheet, trimTenthsMm);

  return (
    <div
      className="plan-print__drawing"
      style={{ height: `${PRINT_DRAWING_MM.height}mm`, width: `${PRINT_DRAWING_MM.width}mm` }}
    >
      <svg
        width={sheet.lengthTenthsMm * scale}
        height={sheet.widthTenthsMm * scale}
        viewBox={`0 0 ${sheet.lengthTenthsMm} ${sheet.widthTenthsMm}`}
      >
        <defs>
          <pattern
            id={hatchId}
            width={HATCH_PX}
            height={HATCH_PX}
            patternUnits="userSpaceOnUse"
            patternTransform={`scale(${1 / scale})`}
          >
            <path
              d={`M 0 ${HATCH_PX} L ${HATCH_PX} 0`}
              stroke={INK}
              strokeWidth={HATCH_STROKE_PX}
              fill="none"
            />
          </pattern>
        </defs>

        {/* A chapa bruta. A faixa dela que fica à vista é o refile: material que
            existe e será descartado, e que por isso não leva a hachura da sobra
            — ele está fora do denominador do aproveitamento (§5.3). */}
        <rect
          x={0}
          y={0}
          width={sheet.lengthTenthsMm}
          height={sheet.widthTenthsMm}
          fill={PAPER}
          stroke={INK}
          strokeWidth={hairline}
        />

        {/* A área útil hachurada; as peças entram por cima, opacas. O que
            continua aparecendo é exatamente a sobra — que assim não precisa ser
            calculada como região. Na folha esta hachura não é redundância da
            cor: é o único canal que sobreviveu à impressora. */}
        <rect
          x={usable.originTenthsMm}
          y={usable.originTenthsMm}
          width={usable.lengthTenthsMm}
          height={usable.widthTenthsMm}
          fill={`url(#${hatchId})`}
          stroke={INK}
          strokeWidth={hairline}
        />

        {sheet.placements.map((placement, index) => (
          <PrintedPiece
            key={`${placement.xTenthsMm}-${placement.yTenthsMm}-${index}`}
            placement={placement}
            label={labels[index]}
            scale={scale}
          />
        ))}
      </svg>
    </div>
  );
}

interface PrintedPieceProps {
  placement: PlanPlacement;
  label: PieceLabel;
  scale: number;
}

function PrintedPiece({ placement, label, scale }: PrintedPieceProps) {
  const centerX = placement.xTenthsMm + placement.lengthTenthsMm / 2;
  const centerY = placement.yTenthsMm + placement.widthTenthsMm / 2;
  const fontSize = LABEL_FONT_PX / scale;
  const lineHeight = LABEL_LINE_PX / scale;

  return (
    <g>
      {/* Branca, e não sem preenchimento: é o que cobre a hachura por baixo e
          faz da peça uma região, em vez de um contorno sobre a sobra. */}
      <rect
        x={placement.xTenthsMm}
        y={placement.yTenthsMm}
        width={placement.lengthTenthsMm}
        height={placement.widthTenthsMm}
        fill={PAPER}
        stroke={INK}
        strokeWidth={PIECE_OUTLINE_PX / scale}
      />

      {label.kind === 'full' && (
        <text textAnchor="middle" dominantBaseline="central" fontSize={fontSize} fill={INK}>
          <tspan x={centerX} y={centerY - lineHeight / 2}>
            {label.identity}
          </tspan>
          <tspan x={centerX} y={centerY + lineHeight / 2}>
            {label.measure}
          </tspan>
        </text>
      )}

      {label.kind === 'number' && (
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize}
          fill={INK}
        >
          {label.number}
        </text>
      )}
    </g>
  );
}
