import { describe, expect, it } from 'vitest';
import type { Rectangle } from '../types/rectangle';
import { fitsAnySheet } from './fit';
import { packCuttingPlan } from './packCuttingPlan';

/**
 * A regra de **rejeição**, isolada do empacotamento: esta peça cabe em alguma
 * chapa do projeto?
 *
 * É o segundo seam da feature, e a razão de ele existir é que o cadastro
 * consulta a régua **sem gerar plano** — o seam do empacotador não alcança essa
 * pergunta. O que se prende aqui continua sendo comportamento observável: qual
 * peça passa e qual é barrada. A aritmética do kerf (ADR-0001) não é medida
 * diretamente; ela aparece pelo que faz, na peça do tamanho exato da chapa e na
 * que só cabia no material que o refile descarta.
 *
 * O último teste é o que prende as duas leituras juntas: a resposta desta régua
 * confrontada com a lista de rejeitadas do próprio empacotador.
 *
 * Toda medida é décimo de milímetro: 10000 é uma chapa de um metro.
 */

function rect(lengthTenthsMm: number, widthTenthsMm: number): Rectangle {
  return { lengthTenthsMm, widthTenthsMm };
}

describe('fitsAnySheet', () => {
  const noGeometry = { kerfTenthsMm: 0, trimTenthsMm: 0 };

  it('aceita a peça menor que a chapa', () => {
    expect(fitsAnySheet(rect(8000, 4000), [rect(10000, 10000)], noGeometry)).toBe(true);
  });

  it('recusa a peça maior que a chapa em qualquer orientação', () => {
    expect(fitsAnySheet(rect(12000, 4000), [rect(10000, 10000)], noGeometry)).toBe(false);
  });

  it('aceita a peça do tamanho exato da chapa quando não há kerf', () => {
    expect(fitsAnySheet(rect(10000, 10000), [rect(10000, 10000)], noGeometry)).toBe(true);
  });

  it('recusa a peça do tamanho exato da chapa assim que há kerf', () => {
    const geometry = { kerfTenthsMm: 3, trimTenthsMm: 0 };
    expect(fitsAnySheet(rect(10000, 10000), [rect(10000, 10000)], geometry)).toBe(false);
  });

  it('recusa a peça que só cabia no material que o refile descarta', () => {
    const sheet = [rect(10000, 10000)];
    expect(fitsAnySheet(rect(9900, 9900), sheet, noGeometry)).toBe(true);
    expect(fitsAnySheet(rect(9900, 9900), sheet, { kerfTenthsMm: 0, trimTenthsMm: 100 })).toBe(
      false,
    );
  });

  it('gira a peça quando é assim que ela cabe', () => {
    expect(fitsAnySheet(rect(8000, 4000), [rect(5000, 9000)], noGeometry)).toBe(true);
  });

  it('basta caber em uma das chapas do projeto', () => {
    const estoque = [rect(4000, 3000), rect(27500, 18500)];
    expect(fitsAnySheet(rect(20000, 6000), estoque, noGeometry)).toBe(true);
  });

  it('aceita qualquer peça quando o projeto não tem chapa nenhuma', () => {
    // Sem chapa não há com o que comparar, e comprar resolve — que é a
    // definição de peça **não alocada**, não de rejeitada.
    expect(fitsAnySheet(rect(99000, 99000), [], noGeometry)).toBe(true);
  });

  it('recusa tudo quando o refile não deixa área útil na chapa', () => {
    expect(
      fitsAnySheet(rect(10, 10), [rect(1000, 1000)], { kerfTenthsMm: 0, trimTenthsMm: 500 }),
    ).toBe(false);
  });

  it('responde o mesmo que a lista de rejeitadas do empacotador', () => {
    const geometry = { kerfTenthsMm: 3, trimTenthsMm: 100 };
    const sheets = [rect(4000, 3000), rect(27500, 18500)];
    const pieces = [
      { id: 'cabe', label: 'lateral', ...rect(20000, 6000), quantity: 1 },
      { id: 'gigante', label: 'tampo', ...rect(30000, 6000), quantity: 1 },
    ];

    const result = packCuttingPlan({
      pieces,
      sheets: sheets.map((sheet, index) => ({ id: String(index), ...sheet, quantity: 1 })),
      ...geometry,
    });

    for (const piece of pieces) {
      const rejeitada = result.rejected.some((shortfall) => shortfall.pieceId === piece.id);
      expect(fitsAnySheet(piece, sheets, geometry), piece.id).toBe(!rejeitada);
    }
  });
});
