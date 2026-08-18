import { useTheme } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryTotalRow } from '@/hooks/categories/useCategoryTotals';
import { formatCurrency } from '@/utils/format';
import { CHART_HEIGHT, axisStyle, tooltipStyle } from './chartTheme';

interface CategoryBreakdownChartProps {
  /** Já vem cortado em `MAX_CHART_CATEGORIES` + "Outras categorias". */
  rows: CategoryTotalRow[];
}

/**
 * Para onde foi o dinheiro do ano, por categoria.
 *
 * As barras são horizontais porque o rótulo é nome de categoria — na vertical
 * ele só cabe deitado. A cor de cada barra é a da própria categoria, definida
 * pelo usuário: aqui ela é categórica, não semântica, e por isso não sai da
 * paleta de estado (§1.7).
 */
export function CategoryBreakdownChart({ rows }: CategoryBreakdownChartProps) {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      {/* A margem à direita é o valor que o `LabelList` escreve depois da
          barra: sem ela o número sai cortado na categoria mais cara. */}
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />
        <XAxis type="number" hide {...axisStyle(theme)} />
        <YAxis type="category" dataKey="name" width={140} {...axisStyle(theme)} />
        <Tooltip
          cursor={{ fill: theme.palette.action.hover }}
          formatter={(value, _name, entry) => {
            const row = entry.payload as CategoryTotalRow;
            return [
              `${formatCurrency(Number(value) || 0)} · ${row.count} despesa(s) · ${row.percent.toFixed(1)}%`,
              'Total',
            ];
          }}
          contentStyle={tooltipStyle(theme)}
        />
        <Bar dataKey="total" barSize={20} radius={[0, 4, 4, 0]}>
          {rows.map((row) => (
            <Cell key={row.key} fill={row.color} />
          ))}
          <LabelList
            dataKey="total"
            position="right"
            formatter={(value) => formatCurrency(Number(value) || 0)}
            style={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
