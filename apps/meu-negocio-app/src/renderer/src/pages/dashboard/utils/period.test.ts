import { describe, expect, it } from 'vitest';
import type { Order } from '@shared/types/order';
import { resolvePeriod } from './period';

function orderAt(year: number, month: number, day: number): Order {
  const date = new Date(year, month - 1, day, 12).toISOString();
  return {
    id: `${year}-${month}-${day}`,
    customerName: 'Cliente',
    status: 'completed',
    items: [],
    amountPaid: 0,
    createdAt: date,
    updatedAt: date,
  };
}

describe('resolvePeriod', () => {
  it('usa o filtro quando ele existe, do início do primeiro dia ao fim do último', () => {
    const period = resolvePeriod([], '2026-03-01', '2026-05-31');
    expect(period.start).toEqual(new Date(2026, 2, 1, 0, 0, 0, 0));
    expect(period.end).toEqual(new Date(2026, 4, 31, 23, 59, 59, 999));
    expect(period.label).toBe('mar de 2026 – mai de 2026');
  });

  it('um mês só vira um rótulo só', () => {
    expect(resolvePeriod([], '2026-09-01', '2026-09-30').label).toBe('set de 2026');
  });

  it('sem filtro cobre do pedido mais antigo até hoje, mesmo sem venda recente', () => {
    const now = new Date(2026, 8, 14, 10);
    const period = resolvePeriod([orderAt(2025, 11, 20), orderAt(2026, 2, 3)], '', '', now);
    expect(period.start).toEqual(new Date(2025, 10, 20, 0, 0, 0, 0));
    expect(period.end).toEqual(new Date(2026, 8, 14, 23, 59, 59, 999));
    expect(period.label).toBe('nov de 2025 – set de 2026');
  });

  it('sem filtro um pedido datado no futuro estica o fim até ele', () => {
    const now = new Date(2026, 8, 14, 10);
    const period = resolvePeriod([orderAt(2026, 11, 2)], '', '', now);
    expect(period.end).toEqual(new Date(2026, 10, 2, 23, 59, 59, 999));
  });

  it('sem filtro e sem pedido cai no dia de hoje', () => {
    const now = new Date(2026, 8, 14, 10);
    const period = resolvePeriod([], '', '', now);
    expect(period.start).toEqual(new Date(2026, 8, 14, 0, 0, 0, 0));
    expect(period.end).toEqual(new Date(2026, 8, 14, 23, 59, 59, 999));
    expect(period.label).toBe('set de 2026');
  });
});
