import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  useXAxisScale,
  useYAxisTicks,
} from 'recharts';
import { LABEL_BAR_GAP, useTextMeasure } from '@/pages/dashboard/hooks/useTextMeasure';
import type { AgingBucket, BucketRow } from '@/pages/dashboard/utils/receivables';
import { formatCount } from '@/pages/dashboard/utils/receivables';
import type { ChartTheme } from '@/theme/chartTheme';
import { CHART_FONT_SIZE, useChartTheme } from '@/theme/chartTheme';
import { formatCurrency } from '@/utils/format';
import { renderLeftAlignedTick } from './renderLeftAlignedTick';

const BAR_SIZE = 20;

/**
 * A rampa é ordinal, não categórica: as quatro faixas não são quatro assuntos
 * diferentes, são um mesmo assunto em quatro graus de severidade. Por isso ela
 * herda a paleta semântica em vez da categórica (§1.7).
 *
 * `warning` só pode aparecer aqui porque barra é **preenchimento**; como texto
 * o âmbar reprova em AA (§1.4), e é por isso que a cor do número, logo abaixo,
 * segue outra regra.
 */
function barColor(chart: ChartTheme, bucket: AgingBucket): string {
  switch (bucket) {
    case '0-15':
    case '16-30':
      return chart.series.agingCurrent;
    case '31-60':
      return chart.series.agingWarning;
    case '60+':
      return chart.series.agingAlert;
  }
}

/**
 * O número na ponta da barra é texto de 12px sobre papel, onde o limiar volta a
 * ser 4,5:1 — então ele não herda a cor da barra. Só `danger` tem par por modo
 * e passa, e pinta só a faixa que pede atenção (§1.5).
 *
 * Faixa zerada cai para `muted`: "R$ 0,00" em vermelho alarma sobre nada, e
 * valor ausente é conteúdo, não controle desabilitado (§1.4).
 */
function labelColor(chart: ChartTheme, row: BucketRow): string {
  if (row.total <= 0) return chart.text.muted;
  if (row.bucket === '60+') return chart.text.danger;
  return chart.text.primary;
}

/**
 * Os valores **não** saem de um `LabelList`, e a razão é a faixa zerada: o
 * Recharts não desenha o retângulo de uma barra de valor zero, e sem retângulo
 * o `LabelList` daquela linha nunca é chamado — a faixa aparecia sem o
 * "R$ 0,00" que é justamente o que ela tem a dizer. Desenhando a camada
 * inteira a partir do eixo, as quatro linhas existem independentemente de
 * existir barra. `LabelList` também pinta a lista toda com um `style` só, e
 * aqui cada linha tem a sua cor.
 */
function ValueLabels({ rows, chart }: { rows: BucketRow[]; chart: ChartTheme }) {
  const xScale = useXAxisScale();
  const ticks = useYAxisTicks();
  if (!xScale || !ticks) return null;

  return (
    <g aria-hidden="true">
      {rows.map((row) => {
        // Casado pelo rótulo, e não pelo índice: a ordem dos ticks é do eixo, e
        // não há por que assumir que ela acompanha a ordem dos dados.
        const tick = ticks.find((t) => t.value === row.label);
        if (!tick) return null;

        return (
          <text
            key={row.bucket}
            x={Number(xScale(row.total)) + LABEL_BAR_GAP}
            y={tick.coordinate}
            dy={4}
            textAnchor="start"
            fontSize={CHART_FONT_SIZE}
            fontWeight={600}
            fill={labelColor(chart, row)}
          >
            {formatCurrency(row.total)}
          </text>
        );
      })}
    </g>
  );
}

/**
 * As quatro faixas aparecem sempre, zeradas inclusive: "nada acima de 60 dias"
 * é informação, e a linha ausente obrigaria o usuário a reparar no que não
 * está lá. É também o que mantém a altura da seção estável sem precisar
 * preencher o conjunto com linhas falsas (§5.3).
 */
export function AccountsReceivableChart({ rows }: { rows: BucketRow[] }) {
  const chart = useChartTheme();

  // O Recharts não mede o texto que ele mesmo desenha (§7): sem estas duas
  // medidas o rótulo mais largo é cortado pela borda do card.
  const measure = useTextMeasure();
  const yAxisWidth = useMemo(
    () => measure.getYAxisWidth(rows.map((r) => r.label)),
    [rows, measure],
  );
  const labelMargin = useMemo(
    () => measure.getLabelMargin(rows.map((r) => formatCurrency(r.total))),
    [rows, measure],
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 0, right: labelMargin, left: 0, bottom: 0 }}
        accessibilityLayer={false}
      >
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey="label"
          width={yAxisWidth}
          tick={(props) => renderLeftAlignedTick(props, chart.axis.tick.fill)}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={chart.cursor}
          isAnimationActive={chart.animate}
          formatter={(value, _name, item) =>
            `${formatCurrency(Number(value))} · ${formatCount(Number(item?.payload?.count ?? 0))}`
          }
          {...chart.tooltip}
        />
        {/* Barra chapada, uma cor por degrau: `<Cell>` não convive com
            `fill="url(#id)"`, e entre as duas quem carrega significado é a cor
            do degrau (§1.7). */}
        <Bar
          dataKey="total"
          name="A receber"
          barSize={BAR_SIZE}
          radius={[0, 4, 4, 0]}
          isAnimationActive={chart.animate}
        >
          {rows.map((row) => (
            <Cell key={row.bucket} fill={barColor(chart, row.bucket)} />
          ))}
        </Bar>
        <ValueLabels rows={rows} chart={chart} />
      </BarChart>
    </ResponsiveContainer>
  );
}
