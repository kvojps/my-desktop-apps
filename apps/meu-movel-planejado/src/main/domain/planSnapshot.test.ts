import { describe, expect, it } from 'vitest';
import { type CuttingPlanInputEntity, packCuttingPlan } from './nesting';
import { toPlanInput } from './planSnapshot';

/**
 * A passagem do resultado do empacotador para o plano que se grava. O que ela
 * decide é o que o plano **deixa de saber**: a identidade da peça e a da chapa
 * ficam para trás, e no lugar delas vai o rótulo copiado.
 *
 * É a tradução do "plano é snapshot, não derivação" para uma função. Testá-la
 * é testar que uma peça excluída amanhã não leva junto a folha que já foi
 * impressa.
 */

const PROJECT_UPDATED_AT = '2026-08-22T14:32:00.000Z';

/** Um armário pequeno: duas laterais, uma prateleira sem rótulo, uma chapa. */
function input(): CuttingPlanInputEntity {
  return {
    pieces: [
      { id: 'p1', label: 'Lateral', lengthTenthsMm: 8000, widthTenthsMm: 4000, quantity: 2 },
      { id: 'p2', label: '', lengthTenthsMm: 6000, widthTenthsMm: 3000, quantity: 1 },
    ],
    sheets: [{ id: 's1', lengthTenthsMm: 27500, widthTenthsMm: 18500, quantity: 1 }],
    kerfTenthsMm: 3,
    trimTenthsMm: 0,
  };
}

describe('toPlanInput', () => {
  it('copia o rótulo da peça em cada colocação', () => {
    const plan = toPlanInput(input(), packCuttingPlan(input()), PROJECT_UPDATED_AT);

    const labels = plan.sheets.flatMap((sheet) =>
      sheet.placements.map((placement) => placement.label),
    );
    expect(labels.filter((label) => label === 'Lateral')).toHaveLength(2);
    expect(labels.filter((label) => label === '')).toHaveLength(1);
  });

  it('não leva nenhuma identidade de peça nem de chapa', () => {
    const plan = toPlanInput(input(), packCuttingPlan(input()), PROJECT_UPDATED_AT);

    // A busca é textual de propósito: qualquer campo novo que reintroduza o
    // vínculo com o estoque aparece aqui, mesmo que o tipo o permita.
    expect(JSON.stringify(plan)).not.toContain('pieceId');
    expect(JSON.stringify(plan)).not.toContain('sheetId');
  });

  it('preserva a geometria de cada colocação', () => {
    const result = packCuttingPlan(input());
    const plan = toPlanInput(input(), result, PROJECT_UPDATED_AT);

    const source = result.sheets[0].placements;
    const copied = plan.sheets[0].placements;
    expect(copied).toHaveLength(source.length);
    for (const [index, placement] of copied.entries()) {
      expect(placement.xTenthsMm, `x da colocação ${index}`).toBe(source[index].xTenthsMm);
      expect(placement.yTenthsMm, `y da colocação ${index}`).toBe(source[index].yTenthsMm);
      expect(placement.lengthTenthsMm, `comprimento ${index}`).toBe(source[index].lengthTenthsMm);
      expect(placement.widthTenthsMm, `largura ${index}`).toBe(source[index].widthTenthsMm);
      expect(placement.rotated, `giro ${index}`).toBe(source[index].rotated);
    }
  });

  it('guarda a geometria do corte e o carimbo do projeto que o originou', () => {
    const plan = toPlanInput(input(), packCuttingPlan(input()), PROJECT_UPDATED_AT);

    expect(plan.kerfTenthsMm).toBe(3);
    expect(plan.trimTenthsMm).toBe(0);
    expect(plan.projectUpdatedAt).toBe(PROJECT_UPDATED_AT);
  });

  it('leva as duas listas de fora e o déficit sem misturá-las', () => {
    const scarce: CuttingPlanInputEntity = {
      pieces: [
        { id: 'p1', label: 'Porta', lengthTenthsMm: 9000, widthTenthsMm: 5000, quantity: 4 },
        {
          id: 'p2',
          label: 'Tampo gigante',
          lengthTenthsMm: 90000,
          widthTenthsMm: 5000,
          quantity: 1,
        },
      ],
      sheets: [{ id: 's1', lengthTenthsMm: 10000, widthTenthsMm: 10000, quantity: 1 }],
      kerfTenthsMm: 3,
      trimTenthsMm: 0,
    };
    const plan = toPlanInput(scarce, packCuttingPlan(scarce), PROJECT_UPDATED_AT);

    expect(plan.rejected).toEqual([
      { label: 'Tampo gigante', lengthTenthsMm: 90000, widthTenthsMm: 5000, quantity: 1 },
    ]);
    expect(plan.unplaced.map((piece) => piece.label)).toEqual(['Porta']);
    expect(plan.deficit.areaTenthsMm2).toBeGreaterThan(0);
    expect(plan.deficit.referenceSheet).toEqual({ lengthTenthsMm: 10000, widthTenthsMm: 10000 });
    expect(plan.deficit.atLeastSheets).toBeGreaterThanOrEqual(1);
  });

  it('não guarda o metro quadrado, que é conta de tela', () => {
    const plan = toPlanInput(input(), packCuttingPlan(input()), PROJECT_UPDATED_AT);

    expect(plan.deficit).not.toHaveProperty('squareMeters');
  });

  it('atravessa o aproveitamento de cada chapa e o do plano', () => {
    const result = packCuttingPlan(input());
    const plan = toPlanInput(input(), result, PROJECT_UPDATED_AT);

    expect(plan.utilization).toBe(result.utilization);
    expect(plan.sheets[0].utilization).toBe(result.sheets[0].utilization);
  });

  it('sobrevive a um projeto sem peça nenhuma', () => {
    const empty: CuttingPlanInputEntity = {
      pieces: [],
      sheets: [],
      kerfTenthsMm: 3,
      trimTenthsMm: 0,
    };
    const plan = toPlanInput(empty, packCuttingPlan(empty), PROJECT_UPDATED_AT);

    expect(plan.sheets).toEqual([]);
    expect(plan.unplaced).toEqual([]);
    expect(plan.rejected).toEqual([]);
    expect(plan.deficit.referenceSheet).toBeNull();
  });
});
