import { Box, useTheme } from '@mui/material';
import { useId, useMemo } from 'react';
import { usableArea } from '@shared/plan/usableArea';
import type { PlanPlacement, PlanSheet } from '@shared/types/plan';
import { useElementSize } from '@/hooks/useElementSize';
import { labelOn } from '@/theme';
import { formatCount, formatDimensions, formatPercent } from '@/utils/format';
import { LABEL_FONT_PX, LABEL_LINE_PX, type PieceLabel } from '../pieceLabels';
import { type PlanPiece, pieceIdentity } from '../planLegend';
import { usePieceLabels } from '../usePieceLabels';

/**
 * Uma chapa planejada, desenhada em escala.
 *
 * É a **superfície métrica em escala** da §5.3 do design system: a única coisa
 * do app cuja altura deriva do conteúdo, porque aqui a proporção *é* o dado.
 * Uma altura fixa desenharia uma chapa de 2750 × 1850 e um retalho de
 * 1000 × 1000 na mesma caixa, e a escala — que era o conteúdo — sumiria.
 *
 * O `viewBox` é o próprio retângulo da chapa em décimo de milímetro, de modo
 * que as coordenadas do plano entram no desenho **sem conversão de unidade**:
 * `x` e `y` de uma colocação vão direto para o `<rect>`. O que precisa da
 * escala é só o que se mede em pixel — a espessura de um traço e o tamanho de
 * um rótulo, que não devem crescer com a chapa.
 *
 * A proporção nunca é esticada: quem cede é a largura. O desenho encolhe até
 * caber nos dois eixos da caixa e fica centralizado nela.
 */

/** Lado do ladrilho da hachura da sobra, em pixel de tela. */
const HATCH_PX = 7;

/**
 * O que depende da escala e não deve crescer com a chapa. Viajam juntos porque
 * saem todos da mesma divisão, e separá-los deixaria um deles para trás na
 * próxima mudança de tipografia.
 */
interface DrawingMetrics {
  /** Espessura que rende um pixel na tela, seja qual for o tamanho da chapa. */
  hairline: number;
  fontSize: number;
  lineHeight: number;
}

interface SheetDrawingProps {
  sheet: PlanSheet;
  /** Paralelo a `sheet.placements`: quem é cada retângulo. */
  pieces: PlanPiece[];
  /**
   * O refile com que **este** plano foi gerado. Vem do plano, e não do projeto:
   * é a margem que este desenho descartou, e mexer no projeto depois não muda o
   * papel que já está na bancada.
   */
  trimTenthsMm: number;
  /** Para o rótulo acessível dizer de qual chapa do plano se trata. */
  position: { index: number; total: number };
}

export function SheetDrawing({ sheet, pieces, trimTenthsMm, position }: SheetDrawingProps) {
  const theme = useTheme();
  const hatchId = useId();
  const [boxRef, box] = useElementSize();

  // Encolhe até caber nos dois eixos: é a razão pixel/décimo de milímetro com
  // que o desenho é pintado, e ela nunca difere entre os eixos.
  const scale = useMemo(() => {
    if (box.width === 0 || box.height === 0) return 0;
    return Math.min(box.width / sheet.lengthTenthsMm, box.height / sheet.widthTenthsMm);
  }, [box.height, box.width, sheet.lengthTenthsMm, sheet.widthTenthsMm]);

  // A mesma regra que decide o rótulo na folha, com a escala da tela: é a
  // escala que muda o degrau, e não o meio.
  const labels = usePieceLabels(sheet.placements, pieces, scale);

  const metrics: DrawingMetrics = {
    hairline: scale === 0 ? 0 : 1 / scale,
    fontSize: scale === 0 ? 0 : LABEL_FONT_PX / scale,
    lineHeight: scale === 0 ? 0 : LABEL_LINE_PX / scale,
  };

  // A área útil: a chapa menos o refile dos dois lados. É o denominador do
  // aproveitamento, e por isso é ela — e não a chapa inteira — que recebe a
  // hachura da sobra. A mesma conta serve à folha (`usableArea`).
  const usable = usableArea(sheet, trimTenthsMm);

  return (
    // A caixa é a mesma antes e depois dos dados, e o desenho está sozinho
    // nela: trocar de chapa muda a altura do desenho, não a posição do resto
    // da tela (design system, §5.3).
    <Box
      ref={boxRef}
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {scale > 0 && (
        <svg
          width={sheet.lengthTenthsMm * scale}
          height={sheet.widthTenthsMm * scale}
          viewBox={`0 0 ${sheet.lengthTenthsMm} ${sheet.widthTenthsMm}`}
          role="img"
          aria-label={ariaLabel(sheet, position)}
        >
          <defs>
            {/* O ladrilho é declarado em pixel e trazido para a unidade do
                desenho pela transformação: a hachura precisa ter sempre o
                mesmo passo na tela, e não um passo que cresce com a chapa. */}
            <pattern
              id={hatchId}
              width={HATCH_PX}
              height={HATCH_PX}
              patternUnits="userSpaceOnUse"
              patternTransform={`scale(${1 / scale})`}
            >
              <path
                d={`M 0 ${HATCH_PX} L ${HATCH_PX} 0`}
                stroke={theme.palette.divider}
                strokeWidth={1}
                fill="none"
              />
            </pattern>
          </defs>

          {/* A chapa bruta, lisa. A faixa dela que fica à vista é o refile:
              material que existe e será descartado, e que por isso não leva a
              hachura da sobra — ele está fora do denominador do aproveitamento,
              e hachurá-lo faria o desenho contradizer o número ao lado (design
              system, §5.3). */}
          <rect
            x={0}
            y={0}
            width={sheet.lengthTenthsMm}
            height={sheet.widthTenthsMm}
            fill={theme.palette.background.paper}
            stroke={theme.palette.text.secondary}
            strokeWidth={metrics.hairline}
          />

          {/* A área útil hachurada; as peças entram por cima, opacas. O que
              continua aparecendo é exatamente a sobra — que assim não precisa
              ser calculada como região, só deixada à mostra. */}
          <rect
            x={usable.originTenthsMm}
            y={usable.originTenthsMm}
            width={usable.lengthTenthsMm}
            height={usable.widthTenthsMm}
            fill={`url(#${hatchId})`}
            stroke={theme.palette.divider}
            strokeWidth={metrics.hairline}
          />

          {sheet.placements.map((placement, index) => (
            <PlacedPiece
              key={`${placement.xTenthsMm}-${placement.yTenthsMm}-${index}`}
              placement={placement}
              piece={pieces[index]}
              label={labels[index]}
              metrics={metrics}
              separator={theme.palette.background.paper}
            />
          ))}
        </svg>
      )}
    </Box>
  );
}

interface PlacedPieceProps {
  placement: PlanPlacement;
  piece: PlanPiece;
  label: PieceLabel;
  metrics: DrawingMetrics;
  separator: string;
}

function PlacedPiece({ placement, piece, label, metrics, separator }: PlacedPieceProps) {
  // O rótulo é texto sobre um preenchimento que o app escolheu por dimensão, e
  // não por modo: a cor dele é medida sobre o preenchimento (§1.8), nunca
  // fixada em branco.
  const ink = labelOn(piece.color);
  const centerX = placement.xTenthsMm + placement.lengthTenthsMm / 2;
  const centerY = placement.yTenthsMm + placement.widthTenthsMm / 2;
  const { fontSize, lineHeight } = metrics;

  return (
    <g>
      {/* A peça se identifica mesmo quando nenhum rótulo coube nela. Sem isto,
          a peça pequena demais até para o número ficaria sem par na legenda: a
          cor é da dimensão, e sozinha ela não distingue duas peças de mesma
          medida e rótulos diferentes. */}
      <title>{describePiece(piece, placement)}</title>

      <rect
        x={placement.xTenthsMm}
        y={placement.yTenthsMm}
        width={placement.lengthTenthsMm}
        height={placement.widthTenthsMm}
        fill={piece.color}
        // O traço é da cor da chapa: duas peças de mesma dimensão são da mesma
        // cor, e encostadas elas leriam como um retângulo só.
        stroke={separator}
        strokeWidth={metrics.hairline}
      />

      {label.kind === 'full' && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize}
          fill={ink}
          x={centerX}
        >
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
          fill={ink}
        >
          {label.number}
        </text>
      )}
    </g>
  );
}

/**
 * O desenho carrega informação, então descreve a si mesmo — não é o gráfico
 * decorativo da §1.7, e `aria-hidden` esconderia o conteúdo da tela.
 */
function ariaLabel(sheet: PlanSheet, position: { index: number; total: number }): string {
  const size = formatDimensions(sheet.lengthTenthsMm, sheet.widthTenthsMm);
  const pieces = formatCount(sheet.placements.length, 'peça', 'peças');
  const utilization = formatPercent(sheet.utilization);
  return `Chapa ${position.index + 1} de ${position.total}, ${size}, com ${pieces} e ${utilization} de aproveitamento.`;
}

/** O par número/rótulo/medida da legenda, para quem aponta o cursor na peça. */
function describePiece(piece: PlanPiece, placement: PlanPlacement): string {
  const size = formatDimensions(placement.lengthTenthsMm, placement.widthTenthsMm);
  return `${pieceIdentity(piece)} — ${size}`;
}
