import type { Order } from '@shared/types/order';

export const MAX_TOP_PRODUCTS = 5;

export interface TopProduct {
  rank: number;
  name: string;
  /** "1. Nome" — o tick do eixo, que carrega a posição junto do nome. */
  label: string;
  qty: number;
}

/** Os cinco produtos que mais saíram, por quantidade, somando todas as vendas. */
export function buildTopProducts(completedOrders: Order[]): TopProduct[] {
  const quantities = new Map<string, number>();
  for (const order of completedOrders) {
    for (const item of order.items) {
      quantities.set(item.productName, (quantities.get(item.productName) ?? 0) + item.quantity);
    }
  }
  return Array.from(quantities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TOP_PRODUCTS)
    .map(([name, qty], i) => ({ rank: i + 1, name, label: `${i + 1}. ${name}`, qty }));
}

/**
 * Completa o ranking até cinco linhas para o gráfico: com menos barras o
 * Recharts as centraria na altura toda, em vez de alinhá-las ao topo.
 */
export function padTopProducts(rows: TopProduct[]): TopProduct[] {
  const padded = [...rows];
  while (padded.length < MAX_TOP_PRODUCTS) {
    padded.push({ rank: padded.length + 1, name: '', label: '', qty: 0 });
  }
  return padded;
}
