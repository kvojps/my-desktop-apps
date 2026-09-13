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
import type { CategoryTotalRow } from '@/hooks/categories/categoryRows';
import { useChartTheme } from '@/theme/chartTheme';
import { categoryColor } from '@/theme/orca';
import { formatCurrency } from '@/utils/format';
import { ChartFrame } from './ChartFrame';

/** Largura de um dígito a 12px, com o `tabular-nums` que a base herda. */
const LABEL_CHAR_WIDTH = 7;

/** O respiro entre a ponta da barra e o valor, e entre o valor e a borda. */
const LABEL_GAP = 12;

/** Quanto o nome da categoria tem no eixo antes de o Recharts o reticenciar. */
const NAME_AXIS_WIDTH = 140;

interface CategoryBreakdownChartProps {
  /** Já vem cortado em sete categorias mais "Outras categorias". */
  rows: CategoryTotalRow[];
  year: number;
}

/**
 * Para onde foi o dinheiro do ano, por categoria.
 *
 * As barras são horizontais porque o rótulo é nome de categoria — na vertical
 * ele só cabe deitado. A cor de cada barra é a da própria categoria, definida
 * pelo usuário: aqui ela é categórica, não semântica, e por isso não sai da
 * paleta de estado (§1.7).
 *
 * O valor é escrito **ao lado** da barra, e não dentro dela. Dentro, ele seria
 * rótulo sobre um preenchimento que o app não escolheu, e passaria a depender
 * de medir cada cor de categoria (§1.8); fora, ele é texto sobre o papel, onde
 * o par por modo já é conhecido. Quem identifica a barra é o nome no eixo, que
 * é o segundo canal que a cor sozinha não dá.
 */
export function CategoryBreakdownChart({ rows, year }: CategoryBreakdownChartProps) {
  const chart = useChartTheme();

  /**
   * A margem à direita é o espaço do valor que o `LabelList` escreve **depois**
   * da barra. O Recharts não mede esse texto, então quem não reservar o espaço
   * o perde: era justamente a categoria mais cara — a de barra mais longa e
   * rótulo mais largo — que saía cortada na borda.
   *
   * Uma constante não resolve, porque "R$ 90,00" e "R$ 12.345,67" pedem
   * larguras bem diferentes. O `tabular-nums` dá dígito de largura fixa (~7px a
   * 12px), e os separadores são mais estreitos que isso — então contar
   * caracteres superestima de leve, que é o lado certo de errar.
   */
  const widestLabel = rows.reduce((max, row) => Math.max(max, formatCurrency(row.total).length), 0);
  const labelMargin = widestLabel * LABEL_CHAR_WIDTH + LABEL_GAP;

  return (
    <ChartFrame
      label={`Total de despesas por categoria em ${year}, da maior para a menor. A alternativa em tabela lista todas as categorias.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ left: 8, right: labelMargin }}
          accessibilityLayer={false}
        >
          <CartesianGrid {...chart.grid} horizontal={false} />
          <XAxis type="number" hide {...chart.axis} />
          <YAxis type="category" dataKey="name" width={NAME_AXIS_WIDTH} {...chart.axis} />
          <Tooltip
            cursor={chart.cursor}
            isAnimationActive={chart.animate}
            formatter={(value, _name, entry) => {
              const row = entry.payload as CategoryTotalRow;
              return [
                `${formatCurrency(Number(value) || 0)} · ${row.count} despesa(s) · ${row.percent.toFixed(1)}%`,
                'Total',
              ];
            }}
            {...chart.tooltip}
          />
          <Bar dataKey="total" barSize={20} radius={[0, 4, 4, 0]} isAnimationActive={chart.animate}>
            {rows.map((row) => (
              <Cell key={row.key} fill={categoryColor(row.color)} />
            ))}
            <LabelList
              dataKey="total"
              position="right"
              formatter={(value) => formatCurrency(Number(value) || 0)}
              style={{ fill: chart.axis.tick.fill, fontSize: chart.axis.tick.fontSize }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
