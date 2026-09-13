import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BALANCE_LABELS } from '@/hooks/months/useMonthBalance';
import { CURRENT_DASH, useChartTheme } from '@/theme/chartTheme';
import { formatCurrency } from '@/utils/format';
import type { ComparisonRow } from '../hooks/useComparisonRows';
import { ChartFrame } from './ChartFrame';

interface MonthComparisonChartProps {
  /** Os meses do ano, já em ordem cronológica. */
  rows: ComparisonRow[];
  year: number;
  onSelectMonth: (id: number) => void;
}

/**
 * O ano mês a mês: entradas e despesas em barras, o Previsto em linha.
 *
 * As duas barras herdam os `accent` que os `StatCard` de Entradas (`success`) e
 * Despesas (`secondary`) já usam nas três telas: é a mesma grandeza, e trocar de
 * cor entre o card e o gráfico logo abaixo dele seria dizer que são coisas
 * diferentes.
 *
 * A linha do Previsto fica em `primary`, que encosta em `secondary` — o par que
 * a §1.7 manda separar. O que as separa aqui é **forma** antes de cor: barra
 * contra linha, mais a legenda, que passou a ser necessária com três séries.
 */
export function MonthComparisonChart({ rows, year, onSelectMonth }: MonthComparisonChartProps) {
  const chart = useChartTheme();
  const current = rows.find((row) => row.isCurrent);

  /**
   * O ponto é o que abre o Mês, e por isso o **mesmo** desenho serve ao ponto
   * parado e ao ponto sob o cursor. Enquanto o ativo era o `{ r: 6 }` default
   * do Recharts, ele cobria o ponto clicável no instante em que o ponteiro
   * chegava: o clique acertava um círculo sem `onClick` e o Mês não abria.
   *
   * Só o Previsto negativo é pintado. Verde em todo mês positivo saturaria a
   * série inteira e, pela §1.5, cor sinaliza condição: fechar na cor da própria
   * linha é o estado normal, não um aviso. É a decisão já tomada na coluna
   * "Realizado" da Visão Geral.
   */
  function projectedDot(radius: number) {
    return function renderProjectedDot(props: {
      cx?: number;
      cy?: number;
      payload?: ComparisonRow;
    }) {
      const { cx, cy, payload } = props;
      if (cx == null || cy == null || !payload) return <></>;
      return (
        <circle
          key={`projected-dot-${payload.id}`}
          cx={cx}
          cy={cy}
          r={radius}
          fill={payload.projected < 0 ? chart.series.negative : chart.series.projected}
          stroke={chart.paper}
          strokeWidth={2}
          cursor="pointer"
          onClick={() => onSelectMonth(payload.id)}
        />
      );
    };
  }

  return (
    <ChartFrame
      label={`Entradas, despesas e ${BALANCE_LABELS.projected} de cada mês de ${year}. Os mesmos valores estão na alternativa em tabela.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        {/* Duas margens, dois rótulos que o Recharts escreve fora da área de
            plotagem e não mede: a da direita é o meio-rótulo do último mês, sem
            a qual o "Dez" sai cortado na borda; a de cima é o "Atual" da
            `ReferenceLine`, que fica acima do topo da plotagem. */}
        <ComposedChart
          data={rows}
          margin={{ top: 24, right: 20, bottom: 0 }}
          accessibilityLayer={false}
        >
          {/* O mês corrente, marcado por linha e não pela `ReferenceArea` que
              estava aqui: num eixo de categorias `x1 === x2` escala para o mesmo
              ponto, e o retângulo saía com largura zero — invisível.

              A linha traz o rótulo junto porque cor não pode ser o único canal
              (§1.7): "Atual" escrito sobrevive a qualquer daltonismo, e é o
              mesmo marcador que a tabela põe ao lado do rótulo do mês. */}
          {current && (
            <ReferenceLine
              x={current.abbr}
              stroke={chart.series.projected}
              strokeDasharray={CURRENT_DASH}
              label={{
                value: 'Atual',
                position: 'top',
                fontSize: 12,
                fill: chart.series.projected,
              }}
            />
          )}
          <CartesianGrid {...chart.grid} />
          <XAxis dataKey="abbr" height={30} interval={0} {...chart.axis} />
          <YAxis width={88} {...chart.axis} />
          <Tooltip
            cursor={chart.cursor}
            isAnimationActive={chart.animate}
            formatter={(value) => formatCurrency(Number(value) || 0)}
            labelFormatter={(value, payload) => payload?.[0]?.payload?.label ?? value}
            {...chart.tooltip}
          />
          <Legend {...chart.legend} />
          <ReferenceLine y={0} stroke={chart.grid.stroke} />
          <Bar
            dataKey="totalIncome"
            name="Entradas"
            fill={chart.series.income}
            maxBarSize={18}
            isAnimationActive={chart.animate}
          />
          <Bar
            dataKey="totalExpense"
            name="Despesas"
            fill={chart.series.expense}
            maxBarSize={18}
            isAnimationActive={chart.animate}
          />
          <Line
            type="monotone"
            dataKey="projected"
            name={BALANCE_LABELS.projected}
            stroke={chart.series.projected}
            strokeWidth={2}
            dot={projectedDot(5)}
            activeDot={projectedDot(6)}
            isAnimationActive={chart.animate}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
