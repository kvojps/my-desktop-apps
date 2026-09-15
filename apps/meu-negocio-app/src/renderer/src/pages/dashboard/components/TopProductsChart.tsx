import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTextMeasure } from '@/pages/dashboard/hooks/useTextMeasure';
import type { TopProduct } from '@/pages/dashboard/utils/topProducts';
import { padTopProducts } from '@/pages/dashboard/utils/topProducts';
import { useChartTheme } from '@/theme/chartTheme';
import { renderLeftAlignedTick } from './renderLeftAlignedTick';

/**
 * O ranking de cinco, em barras horizontais. A série é uma só e fica em
 * `primary`, a cor de identidade do app; o que separa uma barra da outra é o
 * rótulo do eixo, que já carrega a posição junto do nome (§1.7).
 */
export function TopProductsChart({ rows }: { rows: TopProduct[] }) {
  const chart = useChartTheme();
  const measure = useTextMeasure();

  const data = useMemo(() => padTopProducts(rows), [rows]);
  // O Recharts não mede o texto que ele mesmo desenha (§7): sem esta medida o
  // nome mais largo é cortado pela borda do card.
  const yAxisWidth = useMemo(
    () => measure.getYAxisWidth(rows.map((row) => row.label)),
    [rows, measure],
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
        barCategoryGap="30%"
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
          formatter={(value) => `${Number(value)} un`}
          {...chart.tooltip}
        />
        <Bar
          dataKey="qty"
          name="Quantidade"
          fill={chart.series.products}
          radius={[0, 4, 4, 0]}
          barSize={16}
          isAnimationActive={chart.animate}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
