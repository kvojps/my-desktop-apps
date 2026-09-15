import { describe, expect, it } from 'vitest';
import type { Order } from '@shared/types/order';
import { buildReceivables } from './receivables';

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function order(partial: Partial<Order> & { total: number; paid?: number; ageDays: number }): Order {
  const { total, paid = 0, ageDays, ...rest } = partial;
  return {
    id: rest.id ?? `o-${total}-${ageDays}`,
    customerName: 'Cliente',
    status: 'completed',
    items: [
      {
        id: 'i',
        productId: 'p',
        productName: 'Produto',
        quantity: 1,
        unitPrice: total,
        unitCost: 0,
      },
    ],
    amountPaid: paid,
    createdAt: daysAgo(ageDays),
    updatedAt: daysAgo(ageDays),
    ...rest,
  };
}

describe('buildReceivables', () => {
  it('sempre devolve as quatro faixas em ordem, zeradas inclusive', () => {
    const result = buildReceivables([]);
    expect(result.rows.map((r) => r.bucket)).toEqual(['0-15', '16-30', '31-60', '60+']);
    expect(result.rows.map((r) => r.total)).toEqual([0, 0, 0, 0]);
    expect(result.rows.map((r) => r.count)).toEqual([0, 0, 0, 0]);
    expect(result.total).toBe(0);
    expect(result.count).toBe(0);
  });

  it('classifica pela idade da venda, com 15, 30 e 60 dias fechando cada faixa', () => {
    const result = buildReceivables([
      order({ total: 10, ageDays: 0 }),
      order({ total: 20, ageDays: 15 }),
      order({ total: 30, ageDays: 16 }),
      order({ total: 40, ageDays: 30 }),
      order({ total: 50, ageDays: 31 }),
      order({ total: 60, ageDays: 60 }),
      order({ total: 70, ageDays: 61 }),
      order({ total: 80, ageDays: 400 }),
    ]);
    expect(result.rows.map((r) => r.total)).toEqual([30, 70, 110, 150]);
    expect(result.rows.map((r) => r.count)).toEqual([2, 2, 2, 2]);
    expect(result.total).toBe(360);
    expect(result.count).toBe(8);
  });

  it('só conta venda concluída com saldo em aberto, pelo saldo e não pelo total', () => {
    const result = buildReceivables([
      order({ total: 100, paid: 40, ageDays: 1 }),
      order({ total: 100, paid: 100, ageDays: 1 }),
      order({ total: 100, paid: 150, ageDays: 1 }),
      order({ total: 100, ageDays: 1, status: 'pending' }),
      order({ total: 100, ageDays: 1, status: 'cancelled' }),
    ]);
    expect(result.total).toBe(60);
    expect(result.count).toBe(1);
    expect(result.rows[0]).toMatchObject({ bucket: '0-15', total: 60, count: 1 });
  });

  it('usa o total personalizado quando o pedido tem um', () => {
    const result = buildReceivables([
      order({ total: 100, manualTotal: 250, paid: 50, ageDays: 3 }),
    ]);
    expect(result.total).toBe(200);
  });
});
