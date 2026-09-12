import { describe, expect, it } from 'vitest';
import type { Month } from '@shared/types/month';
import {
  type MonthRow,
  PAGE_SIZE,
  isInRange,
  monthKey,
  pageOf,
  sortMonthRows,
  totalPagesFor,
} from './monthRows';

function row(sortKey: string, overrides: Partial<MonthRow> = {}): MonthRow {
  return {
    id: Number(sortKey.replace('-', '')),
    label: sortKey,
    sortKey,
    isCurrent: false,
    overdue: 0,
    overdueAmount: 0,
    totalIncome: 0,
    totalExpense: 0,
    realized: 0,
    paidCount: 0,
    expenseCount: 0,
    ...overrides,
  };
}

const keysOf = (rows: MonthRow[]) => rows.map((r) => r.sortKey);

describe('monthKey e isInRange', () => {
  it('zera o mês à esquerda para a chave ordenar como string', () => {
    expect(monthKey(2026, 3)).toBe('2026-03');
    expect(monthKey(2026, 11) > monthKey(2026, 3)).toBe(true);
  });

  it('inclui os dois extremos do intervalo', () => {
    const month = (year: number, index: number): Month => ({
      id: 1,
      label: 'x',
      year,
      month: index,
      createdAt: '',
    });
    expect(isInRange(month(2026, 1), '2026-01', '2026-03')).toBe(true);
    expect(isInRange(month(2026, 3), '2026-01', '2026-03')).toBe(true);
    expect(isInRange(month(2025, 12), '2026-01', '2026-03')).toBe(false);
    expect(isInRange(month(2026, 4), '2026-01', '2026-03')).toBe(false);
  });
});

describe('sortMonthRows', () => {
  const rows = [row('2026-02'), row('2025-11'), row('2026-10')];

  it('ordena cronologicamente pela chave, não pelo rótulo em português', () => {
    expect(keysOf(sortMonthRows(rows, { key: 'label', direction: 'desc' }))).toEqual([
      '2026-10',
      '2026-02',
      '2025-11',
    ]);
    expect(keysOf(sortMonthRows(rows, { key: 'label', direction: 'asc' }))).toEqual([
      '2025-11',
      '2026-02',
      '2026-10',
    ]);
  });

  it('não altera o arranjo recebido', () => {
    sortMonthRows(rows, { key: 'label', direction: 'asc' });
    expect(keysOf(rows)).toEqual(['2026-02', '2025-11', '2026-10']);
  });

  it('ordena por valores, com negativo abaixo de zero', () => {
    const values = [
      row('2026-01', { realized: -500 }),
      row('2026-02', { realized: 0 }),
      row('2026-03', { realized: 120 }),
    ];
    expect(keysOf(sortMonthRows(values, { key: 'realized', direction: 'asc' }))).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
  });

  it('põe o mês sem despesa por último na coluna de pagas, nos dois sentidos', () => {
    const progress = [
      row('2026-01', { paidCount: 0, expenseCount: 0 }),
      row('2026-02', { paidCount: 1, expenseCount: 4 }),
      row('2026-03', { paidCount: 8, expenseCount: 8 }),
    ];
    expect(keysOf(sortMonthRows(progress, { key: 'paid', direction: 'desc' }))).toEqual([
      '2026-03',
      '2026-02',
      '2026-01',
    ]);
    expect(keysOf(sortMonthRows(progress, { key: 'paid', direction: 'asc' }))).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
  });

  it('cai na ordem cronológica quando a chave não é de nenhuma coluna', () => {
    expect(keysOf(sortMonthRows(rows, { key: 'inexistente', direction: 'asc' }))).toEqual([
      '2025-11',
      '2026-02',
      '2026-10',
    ]);
  });
});

describe('pageOf', () => {
  const rows = Array.from({ length: 30 }, (_, i) => row(`2026-${String(i + 1).padStart(2, '0')}`));

  it('mostra doze meses por página', () => {
    const page = pageOf(rows, 1);
    expect(page.visible).toHaveLength(PAGE_SIZE);
    expect(page.totalPages).toBe(3);
    expect(page.start).toBe(0);
  });

  it('começa a página seguinte onde a anterior parou', () => {
    expect(pageOf(rows, 2).start).toBe(12);
    expect(pageOf(rows, 3).visible).toHaveLength(6);
  });

  it('confina a página pedida ao que existe agora', () => {
    expect(pageOf(rows.slice(0, 5), 3).currentPage).toBe(1);
    expect(pageOf(rows, 0).currentPage).toBe(1);
  });

  it('mantém uma página quando não há nenhuma linha', () => {
    expect(totalPagesFor(0)).toBe(1);
    expect(pageOf([], 1)).toEqual({ currentPage: 1, totalPages: 1, start: 0, visible: [] });
  });
});
