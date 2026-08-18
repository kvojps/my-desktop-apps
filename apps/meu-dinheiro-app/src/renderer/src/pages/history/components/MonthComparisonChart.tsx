import { useTheme } from '@mui/material';
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
import { Month } from '@shared/types/month';
import { BALANCE_LABELS, computeMonthBalance } from '@/hooks/months/useMonthBalance';
import { formatCurrency } from '@/utils/format';
import { CHART_HEIGHT, axisStyle, tooltipStyle } from './chartTheme';

/**
 * O eixo X recebe o mês abreviado, não o rótulo inteiro. Doze rótulos como
 * "Dezembro/2026" pedem ~1300px e se sobrepunham num borrão ilegível mesmo na
 * janela padrão — e o ano já está escolhido no seletor do cabeçalho, então
 * repeti-lo doze vezes não informa nada. O rótulo completo continua no tooltip.
 */
const MONTH_ABBR = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

interface MonthComparisonChartProps {
  /** Meses do ano selecionado, em ordem ascendente. */
  months: Month[];
  onSelectMonth: (id: number) => void;
}

/**
 * O ano mês a mês: entradas e despesas em barras, o previsto em linha.
 *
 * As três séries existem porque esta virou a única leitura do ano — a tabela
 * que carregava entradas e despesas saiu. As duas barras herdam os `accent` que
 * os `StatCard` de Entradas (`success`) e Despesas (`secondary`) já usam nas
 * três telas: é a mesma grandeza, e trocar de cor entre o card e o gráfico logo
 * abaixo dele seria dizer que são coisas diferentes.
 *
 * A linha do Previsto fica em `primary`, que encosta em `secondary` — o par que
 * a §1.7 manda separar. O que as separa aqui é **forma** antes de cor: barra
 * contra linha, mais a legenda, que passou a ser necessária com três séries.
 */
export function MonthComparisonChart({ months, onSelectMonth }: MonthComparisonChartProps) {
  const theme = useTheme();

  const now = new Date();
  const currentKey = monthKey(now.getFullYear(), now.getMonth() + 1);

  const data = months.map((month) => {
    const balance = computeMonthBalance(month);
    return {
      id: month.id,
      label: month.label,
      abbr: MONTH_ABBR[month.month - 1] ?? month.label,
      isCurrent: monthKey(month.year, month.month) === currentKey,
      Entradas: balance.totalIncome,
      Despesas: balance.totalExpense,
      [BALANCE_LABELS.projected]: balance.projected,
    };
  });

  const currentMonth = data.find((entry) => entry.isCurrent);

  /**
   * Só o negativo é pintado. Verde em todo mês positivo saturava a série
   * inteira e, pela §1.5, cor sinaliza condição: fechar no azul da própria
   * linha é o estado normal, não um aviso. É a decisão já tomada na coluna
   * "Realizado" da Visão Geral.
   */
  function renderProjectedDot(props: {
    cx?: number;
    cy?: number;
    payload?: { id: number; [BALANCE_LABELS.projected]: number };
  }) {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload) return <></>;
    const projected = payload[BALANCE_LABELS.projected];
    const color = projected < 0 ? theme.palette.error.main : theme.palette.primary.main;
    return (
      <circle
        key={`projected-dot-${payload.id}`}
        cx={cx}
        cy={cy}
        r={5}
        fill={color}
        stroke={theme.palette.background.paper}
        strokeWidth={2}
        cursor="pointer"
        onClick={() => onSelectMonth(payload.id)}
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      {/* A margem à direita é o meio-rótulo do último mês: sem ela o "Dez" sai
          cortado na borda do gráfico. */}
      <ComposedChart data={data} margin={{ top: 8, right: 20, bottom: 0 }}>
        {/* O mês corrente, marcado por linha e não pela `ReferenceArea` que
            estava aqui: num eixo de categorias `x1 === x2` escala para o mesmo
            ponto, e o retângulo saía com largura zero — invisível. Enquanto
            havia a tabela ao lado, o `Chip "Atual"` dela cobria a falta; sem a
            tabela, este é o único marcador de "hoje" da tela.

            A linha traz o rótulo junto porque cor não pode ser o único canal
            (§1.7): "Atual" escrito sobrevive a qualquer daltonismo. */}
        {currentMonth && (
          <ReferenceLine
            x={currentMonth.abbr}
            stroke={theme.palette.primary.main}
            strokeDasharray="4 4"
            label={{
              value: 'Atual',
              position: 'top',
              fontSize: 12,
              fill: theme.palette.primary.main,
            }}
          />
        )}
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey="abbr" height={30} interval={0} {...axisStyle(theme)} />
        <YAxis width={88} {...axisStyle(theme)} />
        <Tooltip
          cursor={{ fill: theme.palette.action.hover }}
          formatter={(value) => formatCurrency(Number(value) || 0)}
          labelFormatter={(value, payload) => payload?.[0]?.payload?.label ?? value}
          contentStyle={tooltipStyle(theme)}
        />
        <Legend />
        <ReferenceLine y={0} stroke={theme.palette.divider} />
        <Bar dataKey="Entradas" fill={theme.palette.success.main} maxBarSize={18} />
        <Bar dataKey="Despesas" fill={theme.palette.secondary.main} maxBarSize={18} />
        <Line
          type="monotone"
          dataKey={BALANCE_LABELS.projected}
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={renderProjectedDot}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
