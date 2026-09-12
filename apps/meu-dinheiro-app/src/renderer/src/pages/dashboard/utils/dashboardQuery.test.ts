import { describe, expect, it } from 'vitest';
import type { Month } from '@shared/types/month';
import type { DashboardQuery } from '@/contexts/NavigationContext';
import { restoreDashboardQuery } from './dashboardQuery';

function month(year: number, index: number): Month {
  return {
    id: year * 100 + index,
    label: `${index}/${year}`,
    year,
    month: index,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

const QUERY: DashboardQuery = {
  from: '2026-01',
  to: '2026-12',
  sortKey: 'realized',
  sortDirection: 'asc',
  page: 3,
};

const YEAR_2026 = Array.from({ length: 12 }, (_, i) => month(2026, i + 1));

describe('restoreDashboardQuery', () => {
  it('não restaura nada quando a sessão não guardou consulta', () => {
    expect(restoreDashboardQuery(null, YEAR_2026)).toBeNull();
  });

  it('devolve intervalo, ordenação e página quando os meses continuam lá', () => {
    const months = [...YEAR_2026, ...Array.from({ length: 12 }, (_, i) => month(2027, i + 1))];
    expect(restoreDashboardQuery({ ...QUERY, to: '2027-12', page: 2 }, months)).toEqual({
      ...QUERY,
      to: '2027-12',
      page: 2,
    });
  });

  it('recua para a última página existente quando a tabela encolheu', () => {
    // A consulta pedia a página 3; sobraram meses para uma só.
    expect(restoreDashboardQuery(QUERY, YEAR_2026.slice(0, 5))?.page).toBe(1);
  });

  it('preserva o intervalo escolhido mesmo sem nenhum mês dentro dele', () => {
    const restored = restoreDashboardQuery(QUERY, [month(2025, 6)]);
    expect(restored).toEqual({ ...QUERY, page: 1 });
  });

  it('não confina a página quando os meses ainda não chegaram', () => {
    // Lista vazia é "ainda carregando": confinar aqui perderia a página por
    // causa de um estado que dura um quadro.
    expect(restoreDashboardQuery(QUERY, [])).toEqual(QUERY);
  });

  it('ignora página inválida guardada por uma sessão anterior', () => {
    expect(restoreDashboardQuery({ ...QUERY, page: 0 }, YEAR_2026)?.page).toBe(1);
  });

  it('conta as páginas pelos meses dentro do intervalo, não por todos', () => {
    const months = [
      ...YEAR_2026,
      ...Array.from({ length: 24 }, (_, i) => month(2027, (i % 12) + 1)),
    ];
    // Doze meses em 2026 cabem numa página só, por mais meses que existam fora.
    expect(restoreDashboardQuery({ ...QUERY, page: 2 }, months)?.page).toBe(1);
  });
});
