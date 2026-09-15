import { describe, expect, it } from 'vitest';
import type { Order } from '@shared/types/order';
import { buildMonthlySeries } from './monthlySeries';

function sale(
  year: number,
  month: number,
  price: number,
  cost: number,
  manualTotal?: number,
): Order {
  const date = new Date(year, month - 1, 10, 12).toISOString();
  return {
    id: `${year}-${month}-${price}`,
    customerName: 'Cliente',
    status: 'completed',
    items: [
      {
        id: 'i',
        productId: 'p',
        productName: 'Produto',
        quantity: 2,
        unitPrice: price,
        unitCost: cost,
      },
    ],
    manualTotal,
    amountPaid: 0,
    createdAt: date,
    updatedAt: date,
  };
}

const period = { start: new Date(2026, 0, 1), end: new Date(2026, 2, 31, 23, 59, 59, 999) };

describe('buildMonthlySeries', () => {
  it('enumera todo mês do período, zerado quando não houve venda', () => {
    const rows = buildMonthlySeries([], period);
    expect(rows.map((r) => r.month)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(rows.map((r) => r.total)).toEqual([0, 0, 0]);
    expect(rows.map((r) => r.profit)).toEqual([0, 0, 0]);
  });

  it('soma faturamento e lucro por mês, respeitando o total personalizado', () => {
    const rows = buildMonthlySeries(
      [sale(2026, 1, 100, 60), sale(2026, 1, 50, 10), sale(2026, 3, 100, 60, 500)],
      period,
    );
    expect(rows.map((r) => r.total)).toEqual([300, 0, 500]);
    expect(rows.map((r) => r.profit)).toEqual([160, 0, 380]);
  });

  it('estica as bordas para cobrir uma venda fora do período', () => {
    const rows = buildMonthlySeries([sale(2025, 11, 10, 5)], period);
    expect(rows.map((r) => r.month)).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
    expect(rows[0].total).toBe(20);
  });

  it('a célula da tabela sempre traz o ano por extenso', () => {
    expect(buildMonthlySeries([], period).map((r) => r.monthTitle)).toEqual([
      'jan de 2026',
      'fev de 2026',
      'mar de 2026',
    ]);
  });

  it('só põe o ano no rótulo quando o recorte cruza anos', () => {
    expect(buildMonthlySeries([], period).map((r) => r.monthLabel)).toEqual(['jan', 'fev', 'mar']);
    expect(buildMonthlySeries([sale(2025, 12, 1, 1)], period).map((r) => r.monthLabel)).toEqual([
      'dez/25',
      'jan/26',
      'fev/26',
      'mar/26',
    ]);
  });
});
