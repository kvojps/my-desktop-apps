import { describe, expect, it } from 'vitest';
import { type PendingReturn, returnFor } from './pendingReturn';

const pending: PendingReturn = {
  view: 'history',
  query: { year: 2025, tab: 'categories', mode: 'chart' },
  scroll: 120,
};

describe('returnFor', () => {
  it('responde à tela que armou o retorno', () => {
    expect(returnFor(pending, 'history')).toEqual(pending);
  });

  it('não responde a outra tela', () => {
    expect(returnFor(pending, 'dashboard')).toBeNull();
  });

  it('não responde quando não há retorno armado', () => {
    expect(returnFor(null, 'history')).toBeNull();
  });
});
