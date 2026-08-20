import {
  Inventory2Outlined,
  PercentOutlined,
  SellOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { useMemo } from 'react';
import type { Product } from '@shared/types/product';
import { getProductMargin, getProductStockValue } from '@shared/types/product';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import type { StatCardProps } from '@/components/StatCard';
import { formatCurrency, formatPercent } from '@/utils/format';

const CARD_COUNT = 4;

interface ProductStatsProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductStats({ products, isLoading }: ProductStatsProps) {
  const cards: StatCardProps[] = useMemo(() => {
    const stockValue = products.reduce((sum, p) => sum + getProductStockValue(p), 0);
    const potentialRevenue = products.reduce((sum, p) => sum + p.salePrice * p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

    // Margem média ponderada pelo que está em estoque, e não a média simples das
    // margens: um item caro parado pesa mais no resultado do que um barato.
    const priced = products.filter((p) => getProductMargin(p) !== undefined && p.stock > 0);
    const pricedRevenue = priced.reduce((sum, p) => sum + p.salePrice * p.stock, 0);
    const pricedCost = priced.reduce((sum, p) => sum + getProductStockValue(p), 0);
    const avgMargin =
      pricedRevenue > 0 ? ((pricedRevenue - pricedCost) / pricedRevenue) * 100 : undefined;

    return [
      {
        label: 'Produtos',
        value: String(products.length),
        sub: 'itens no catálogo',
        icon: Inventory2Outlined,
        accent: 'primary',
      },
      {
        label: 'Valor em Estoque',
        value: formatCurrency(stockValue),
        sub: 'a preço de custo',
        icon: SellOutlined,
        accent: 'info',
      },
      {
        label: 'Margem Média',
        value: avgMargin === undefined ? '—' : formatPercent(avgMargin),
        sub: avgMargin === undefined ? 'sem itens precificados' : 'ponderada pelo estoque',
        icon: PercentOutlined,
        accent: 'success',
      },
      {
        label: 'Estoque Baixo',
        value: String(lowStockCount),
        sub:
          potentialRevenue > 0
            ? `${formatCurrency(potentialRevenue)} de venda potencial`
            : 'nada em estoque',
        icon: WarningAmberOutlined,
        tone: lowStockCount > 0 ? 'alert' : 'neutral',
      },
    ];
  }, [products]);

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
