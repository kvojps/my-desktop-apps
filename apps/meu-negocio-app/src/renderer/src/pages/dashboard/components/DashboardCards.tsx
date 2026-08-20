import {
  PendingActionsOutlined,
  ReceiptOutlined,
  ShoppingCartOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import type { StatCardProps } from '@/components/StatCard';
import { formatCurrency } from '@/utils/format';

const CARD_COUNT = 4;

interface DashboardCardsProps {
  isLoading?: boolean;
  periodSales: number;
  avgTicket: number;
  pendingOrders: number;
  lowStockCount: number;
  avgTicketTrend?: number;
  /** Período de comparação das tendências, de mesma duração. */
  prevPeriodLabel: string;
}

export function DashboardCards({
  isLoading,
  periodSales,
  avgTicket,
  pendingOrders,
  lowStockCount,
  avgTicketTrend,
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
  // Faturamento e Lucro saíram daqui: viraram tags ao lado do título do
  // gráfico "Faturamento e Lucro por Mês", que já é a leitura detalhada dos
  // dois — repeti-los em card duplicava o número sem acrescentar contexto.
  //
  // O `accent` de cada card é o mesmo em todas as telas onde o indicador
  // reaparece — para o usuário reconhecer o número antes de ler o rótulo.
  const cards: StatCardProps[] = [
    {
      label: 'Vendas',
      value: String(periodSales),
      sub: 'pedidos concluídos',
      icon: ShoppingCartOutlined,
      accent: 'secondary',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(avgTicket),
      sub: 'por venda',
      icon: ReceiptOutlined,
      accent: 'info',
      trend: trendOf(avgTicketTrend),
    },
    {
      label: 'Pedidos Pendentes',
      value: String(pendingOrders),
      sub: 'aguardando processamento',
      icon: PendingActionsOutlined,
      accent: 'warning',
    },
    {
      label: 'Estoque Baixo',
      value: String(lowStockCount),
      sub: lowStockCount === 1 ? 'produto abaixo do mínimo' : 'produtos abaixo do mínimo',
      icon: WarningAmberOutlined,
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
