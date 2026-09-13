import { describe, expect, it } from 'vitest';
import type { CategoryTotal } from '@shared/types/category';
import { MAX_CHART_CATEGORIES, categoryBreakdown } from './categoryRows';

function total(id: number | null, amount: number, count = 1): CategoryTotal {
  return {
    categoryId: id,
    name: id === null ? null : `Categoria ${id}`,
    color: id === null ? null : '#5C6BC0',
    total: amount,
    count,
  };
}

/** Nove categorias decrescentes: 900, 800, …, 100. */
const nine = Array.from({ length: 9 }, (_, i) => total(i + 1, 900 - i * 100));

describe('categoryBreakdown', () => {
  it('ordena da maior para a menor, independentemente da ordem recebida', () => {
    const { tableRows } = categoryBreakdown([total(1, 100), total(2, 900), total(3, 400)]);
    expect(tableRows.map((r) => r.total)).toEqual([900, 400, 100]);
  });

  it('lista todas as categorias na tabela e agrupa a cauda no gráfico', () => {
    const { tableRows, chartRows } = categoryBreakdown(nine);
    expect(tableRows).toHaveLength(9);
    expect(chartRows).toHaveLength(MAX_CHART_CATEGORIES + 1);
    expect(chartRows.at(-1)).toMatchObject({
      key: 'other',
      name: 'Outras categorias',
      total: 200 + 100,
      count: 2,
    });
  });

  it('não agrupa nada enquanto as categorias couberem no gráfico', () => {
    const { chartRows } = categoryBreakdown(nine.slice(0, MAX_CHART_CATEGORIES));
    expect(chartRows).toHaveLength(MAX_CHART_CATEGORIES);
    expect(chartRows.some((r) => r.key === 'other')).toBe(false);
  });

  it('mantém gráfico e tabela somando o mesmo total e 100%', () => {
    const { tableRows, chartRows, grandTotal } = categoryBreakdown(nine);
    const sum = (rows: { total: number }[]) => rows.reduce((acc, r) => acc + r.total, 0);
    expect(sum(chartRows)).toBe(grandTotal);
    expect(sum(tableRows)).toBe(grandTotal);
    expect(chartRows.reduce((acc, r) => acc + r.percent, 0)).toBeCloseTo(100);
  });

  it('nomeia a linha sem categoria e não inventa cor para ela', () => {
    const { tableRows } = categoryBreakdown([total(null, 500), total(1, 100)]);
    expect(tableRows[0]).toMatchObject({
      key: 'uncategorized',
      name: 'Sem categoria',
      color: null,
    });
  });

  it('deixa "Outras categorias" sem cor própria, como a linha sem categoria', () => {
    const { chartRows } = categoryBreakdown(nine);
    expect(chartRows.at(-1)?.color).toBeNull();
  });

  it('preserva a cor cadastrada da categoria', () => {
    const { tableRows } = categoryBreakdown([{ ...total(1, 100), color: '#D81B60' }]);
    expect(tableRows[0].color).toBe('#D81B60');
  });

  it('deixa a maior categoria como indicador e nada quando não há despesa', () => {
    expect(categoryBreakdown(nine).topCategory?.total).toBe(900);
    expect(categoryBreakdown([]).topCategory).toBeNull();
  });

  it('não divide por zero quando todas as categorias somam zero', () => {
    const { tableRows, grandTotal } = categoryBreakdown([total(1, 0), total(2, 0)]);
    expect(grandTotal).toBe(0);
    expect(tableRows.every((r) => r.percent === 0)).toBe(true);
  });
});
