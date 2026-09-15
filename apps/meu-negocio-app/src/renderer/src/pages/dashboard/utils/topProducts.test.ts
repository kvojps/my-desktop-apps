import { describe, expect, it } from 'vitest';
import type { Order, OrderItem } from '@shared/types/order';
import { MAX_TOP_PRODUCTS, buildTopProducts, padTopProducts } from './topProducts';

function item(productName: string, quantity: number): OrderItem {
  return {
    id: `${productName}-${quantity}`,
    productId: productName,
    productName,
    quantity,
    unitPrice: 1,
    unitCost: 0,
  };
}

function sale(id: string, items: OrderItem[]): Order {
  return {
    id,
    customerName: 'Cliente',
    status: 'completed',
    items,
    amountPaid: 0,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
  };
}

describe('buildTopProducts', () => {
  it('soma a quantidade por produto entre pedidos e ordena do mais vendido', () => {
    const rows = buildTopProducts([
      sale('a', [item('Bolo', 2), item('Pão', 5)]),
      sale('b', [item('Bolo', 4)]),
    ]);
    expect(rows).toEqual([
      { rank: 1, name: 'Bolo', label: '1. Bolo', qty: 6 },
      { rank: 2, name: 'Pão', label: '2. Pão', qty: 5 },
    ]);
  });

  it('corta no ranking de cinco', () => {
    const items = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((name, i) => item(name, 10 - i));
    const rows = buildTopProducts([sale('a', items)]);
    expect(rows).toHaveLength(MAX_TOP_PRODUCTS);
    expect(rows.map((r) => r.name)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('sem venda devolve lista vazia', () => {
    expect(buildTopProducts([])).toEqual([]);
  });
});

describe('padTopProducts', () => {
  it('completa até cinco linhas com linhas vazias, sem mexer nas reais', () => {
    const rows = buildTopProducts([sale('a', [item('Bolo', 2)])]);
    const padded = padTopProducts(rows);
    expect(padded).toHaveLength(MAX_TOP_PRODUCTS);
    expect(padded[0]).toEqual(rows[0]);
    expect(padded[4]).toEqual({ rank: 5, name: '', label: '', qty: 0 });
  });

  it('não corta nem acrescenta quando já são cinco', () => {
    const items = ['A', 'B', 'C', 'D', 'E'].map((name, i) => item(name, 5 - i));
    const rows = buildTopProducts([sale('a', items)]);
    expect(padTopProducts(rows)).toEqual(rows);
  });
});
