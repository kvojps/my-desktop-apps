import { describe, expect, it } from 'vitest';
import { pageWindow } from './pageWindow';

describe('pageWindow', () => {
  it('mostra todas as páginas enquanto elas cabem', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
  });

  it('abre uma lacuna do lado que ficou de fora', () => {
    expect(pageWindow(1, 9)).toEqual([1, 2, 'gap', 9]);
    expect(pageWindow(9, 9)).toEqual([1, 'gap', 8, 9]);
  });

  it('mantém a atual entre as vizinhas, com lacuna dos dois lados', () => {
    expect(pageWindow(5, 9)).toEqual([1, 'gap', 4, 5, 6, 'gap', 9]);
  });

  it('não abre lacuna para uma página só', () => {
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('não repete nem extrapola as pontas', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 2)).toEqual([1, 2]);
  });
});
