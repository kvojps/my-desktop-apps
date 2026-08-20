import {
  HourglassBottomOutlined,
  PaymentsOutlined,
  ReceiptOutlined,
  SavingsOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { useMemo } from 'react';
import type { Order } from '@shared/types/order';
import { getOrderBalanceDue, getOrderProfit, getOrderTotal } from '@shared/types/order';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import type { StatCardProps } from '@/components/StatCard';
import { formatCurrency, formatPercent } from '@/utils/format';

const CARD_COUNT = 5;

interface SalesCardsProps {
  completedOrders: Order[];
  isLoading?: boolean;
}

export function SalesCards({ completedOrders, isLoading }: SalesCardsProps) {
  const cards: StatCardProps[] = useMemo(() => {
    const totalRevenue = completedOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
    const totalProfit = completedOrders.reduce((sum, o) => sum + getOrderProfit(o), 0);
    const totalPaid = completedOrders.reduce((sum, o) => sum + o.amountPaid, 0);
    const totalBalanceDue = completedOrders.reduce((sum, o) => sum + getOrderBalanceDue(o), 0);
    const pendingCount = completedOrders.filter((o) => getOrderBalanceDue(o) > 0).length;
    const totalSales = completedOrders.length;
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    return [
      {
        label: 'Total Vendido',
        value: formatCurrency(totalRevenue),
        sub: `${totalSales} venda${totalSales !== 1 ? 's' : ''}`,
        icon: TrendingUpOutlined,
        accent: 'primary',
      },
      {
        label: 'Lucro Total',
        value: formatCurrency(totalProfit),
        sub:
          totalRevenue > 0
            ? `${formatPercent((totalProfit / totalRevenue) * 100)} de margem`
            : 'sem vendas',
        icon: SavingsOutlined,
        accent: 'success',
        tone: totalProfit < 0 ? 'alert' : 'positive',
      },
      {
        label: 'Recebido',
        value: formatCurrency(totalPaid),
        sub:
          totalRevenue > 0
            ? `${formatPercent((totalPaid / totalRevenue) * 100)} do total`
            : 'sem vendas',
        icon: PaymentsOutlined,
        accent: 'info',
      },
      {
        label: 'A Receber',
        value: formatCurrency(totalBalanceDue),
        sub:
          pendingCount > 0
            ? `${pendingCount} pedido${pendingCount !== 1 ? 's' : ''} em aberto`
            : 'tudo recebido',
        icon: HourglassBottomOutlined,
        // Só há o que cobrar quando sobra saldo; sem isso o card ficaria em
        // alerta permanente mesmo com tudo quitado.
        tone: totalBalanceDue > 0 ? 'alert' : 'neutral',
      },
      {
        label: 'Ticket Médio',
        value: formatCurrency(avgTicket),
        sub: 'por venda',
        icon: ReceiptOutlined,
        accent: 'secondary',
      },
    ];
  }, [completedOrders]);

  if (isLoading) {
    return (
      <StatCardGrid count={CARD_COUNT}>
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </StatCardGrid>
    );
  }

  return (
    <StatCardGrid count={cards.length}>
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </StatCardGrid>
  );
}
