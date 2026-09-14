import { Boxes, Percent, TriangleAlert, WalletCards } from 'lucide-react';
import { useMemo } from 'react';
import type { Product } from '@shared/types/product';
import { getProductMargin, getProductStockValue } from '@shared/types/product';
import { formatCurrency, formatPercent } from '@/utils/format';

const CARD_COUNT = 4;

interface ProductStatsProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductStats({ products, isLoading }: ProductStatsProps) {
  const cards = useMemo(() => {
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
        icon: Boxes,
      },
      {
        label: 'Valor em Estoque',
        value: formatCurrency(stockValue),
        sub: 'a preço de custo',
        icon: WalletCards,
      },
      {
        label: 'Margem Média',
        value: avgMargin === undefined ? '—' : formatPercent(avgMargin),
        sub: avgMargin === undefined ? 'sem itens precificados' : 'ponderada pelo estoque',
        icon: Percent,
      },
      {
        label: 'Estoque Baixo',
        value: String(lowStockCount),
        sub:
          potentialRevenue > 0
            ? `${formatCurrency(potentialRevenue)} de venda potencial`
            : 'nada em estoque',
        icon: TriangleAlert,
        alert: lowStockCount > 0,
      },
    ];
  }, [products]);

  if (isLoading) {
    return (
      <div className="negocio-stat-grid">
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <div className="negocio-stat negocio-stat-skeleton" key={i}>
            <span className="negocio-skeleton" />
            <span className="negocio-skeleton" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="negocio-stat-grid">
      {cards.map(({ icon: Icon, alert, ...card }) => (
        <section key={card.label} className="negocio-stat">
          <div>
            <span className="negocio-stat-label">{card.label}</span>
            <strong data-alert={alert}>{card.value}</strong>
          </div>
          <Icon aria-hidden="true" />
          <small>{card.sub}</small>
        </section>
      ))}
    </div>
  );
}
