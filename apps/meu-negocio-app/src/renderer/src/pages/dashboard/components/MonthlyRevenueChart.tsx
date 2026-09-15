import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyRow } from '@/pages/dashboard/utils/monthlySeries';
import { useChartTheme } from '@/theme/chartTheme';
import { formatCurrency, formatCurrencyCompact } from '@/utils/format';

/**
 * Faturamento e lucro de cada mês do recorte, lado a lado. As duas barras
 * herdam as cores das tags do cabeçalho — é a mesma grandeza, e trocar de cor
 * entre a tag e o gráfico logo abaixo dela seria dizer que são coisas
 * diferentes (§1.5). Barra chapada, sem o degradê da base antiga: a cor da
 * série é o que a identifica, e um degradê a diluía na metade de baixo.
 */
export function MonthlyRevenueChart({ rows }: { rows: MonthlyRow[] }) {
  const chart = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={rows}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        barGap={4}
        accessibilityLayer={false}
      >
        <CartesianGrid vertical={false} {...chart.grid} />
        <XAxis
          dataKey="monthLabel"
          interval="preserveStartEnd"
          tick={chart.axis.tick}
          axisLine={{ stroke: chart.axis.stroke }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCurrencyCompact}
          tick={chart.axis.tick}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          cursor={chart.cursor}
          isAnimationActive={chart.animate}
          formatter={(value) => formatCurrency(Number(value))}
          labelFormatter={(label, payload) => payload?.[0]?.payload?.monthTitle ?? label}
          {...chart.tooltip}
        />
        <Bar
          dataKey="total"
          name="Faturamento"
          fill={chart.series.revenue}
          radius={[4, 4, 0, 0]}
          isAnimationActive={chart.animate}
        />
        <Bar
          dataKey="profit"
          name="Lucro"
          fill={chart.series.profit}
          radius={[4, 4, 0, 0]}
          isAnimationActive={chart.animate}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
