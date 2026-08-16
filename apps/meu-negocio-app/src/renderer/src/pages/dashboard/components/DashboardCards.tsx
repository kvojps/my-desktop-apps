import {
  PendingActions,
  Receipt,
  Savings,
  ShoppingCart,
  TrendingUp,
  WarningAmber,
} from '@mui/icons-material';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import type { StatCardProps } from '@/components/StatCard';
import { formatCurrency, formatPercent } from '@/utils/format';

const CARD_COUNT = 6;

interface DashboardCardsProps {
  isLoading?: boolean;
  totalRevenue: number;
  totalProfit: number;
  periodSales: number;
  avgTicket: number;
  pendingOrders: number;
  lowStockCount: number;
  revenueTrend?: number;
  profitTrend?: number;
  avgTicketTrend?: number;
  /** Período analisado, ex. "jan/2026 – mar/2026". */
  periodLabel: string;
  /** Período de comparação das tendências, de mesma duração. */
  prevPeriodLabel: string;
}

export function DashboardCards({
  isLoading,
  totalRevenue,
  totalProfit,
  periodSales,
  avgTicket,
  pendingOrders,
  lowStockCount,
  revenueTrend,
  profitTrend,
  avgTicketTrend,
  periodLabel,
  prevPeriodLabel,
}: DashboardCardsProps) {
  if (isLoading) {
    return (
      <StatCardGrid count={CARD_COUNT}>
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </StatCardGrid>
    );
  }

  const trendOf = (pct?: number) =>
    pct === undefined ? undefined : { pct, comparedTo: prevPeriodLabel };

  // Os rótulos não repetem "no Período": o recorte já está no filtro acima e na
  // linha de apoio de cada card.
  //
  // O `accent` de cada card é o mesmo em todas as telas onde o indicador
  // reaparece — faturamento é sempre azul, lucro sempre verde — para o usuário
  // reconhecer o número antes de ler o rótulo.
  const cards: StatCardProps[] = [
    {
      label: 'Faturamento',
      value: formatCurrency(totalRevenue),
      sub: `${periodSales} venda${periodSales !== 1 ? 's' : ''} em ${periodLabel}`,
      icon: TrendingUp,
      accent: 'primary',
      trend: trendOf(revenueTrend),
    },
    {
      label: 'Lucro',
      value: formatCurrency(totalProfit),
      sub:
        totalRevenue > 0
          ? `${formatPercent((totalProfit / totalRevenue) * 100)} de margem`
          : 'sem vendas',
      icon: Savings,
      accent: 'success',
      trend: trendOf(profitTrend),
    },
    {
      label: 'Vendas',
      value: String(periodSales),
      sub: 'pedidos concluídos',
      icon: ShoppingCart,
      accent: 'secondary',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(avgTicket),
      sub: 'por venda',
      icon: Receipt,
      accent: 'info',
      trend: trendOf(avgTicketTrend),
    },
    {
      label: 'Pedidos Pendentes',
      value: String(pendingOrders),
      sub: 'aguardando processamento',
      icon: PendingActions,
      accent: 'warning',
    },
    {
      label: 'Estoque Baixo',
      value: String(lowStockCount),
      sub: lowStockCount === 1 ? 'produto abaixo do mínimo' : 'produtos abaixo do mínimo',
      icon: WarningAmber,
      // Vermelho só quando há de fato produto para repor — um zero em alerta
      // treina o usuário a ignorar a cor.
      tone: lowStockCount > 0 ? 'alert' : 'neutral',
    },
  ];

  return (
    <StatCardGrid count={cards.length}>
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </StatCardGrid>
  );
}
