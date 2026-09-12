import { describe, expect, it } from 'vitest';
import { restoreHistoryQuery } from './historyQuery';

const saved = { year: 2025, tab: 'categories' } as const;

describe('restoreHistoryQuery', () => {
  it('não restaura nada quando não há retorno pendente', () => {
    expect(restoreHistoryQuery(null, [2026, 2025])).toBeNull();
  });

  it('devolve o ano e a aba escolhidos quando o ano ainda existe', () => {
    expect(restoreHistoryQuery(saved, [2026, 2025])).toEqual(saved);
  });

  it('cai no ano mais recente quando o ano guardado deixou de existir', () => {
    expect(restoreHistoryQuery(saved, [2026, 2024])).toEqual({ year: 2026, tab: 'categories' });
  });

  it('preserva a consulta enquanto os anos ainda não chegaram', () => {
    expect(restoreHistoryQuery(saved, [])).toEqual(saved);
  });
});
