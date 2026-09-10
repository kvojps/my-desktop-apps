import { describe, expect, it } from 'vitest';
import type { PlanPlacement, PlanSheet } from '@shared/types/plan';
import { buildPlanLegend, pieceIdentity } from './planLegend';

/**
 * A legenda é o que dá **nome e número** ao retângulo desenhado. Ela existe
 * porque o rótulo nem sempre cabe dentro da peça: quando não cabe, o que fica
 * no desenho é o número, e é a legenda ao lado que diz o que ele é.
 *
 * O que estes testes prendem é a identidade: a mesma peça precisa ser o mesmo
 * número em toda chapa do plano, inclusive quando ela caiu girada numa delas.
 * Cor e ordem são consequência disso.
 */

const PALETTE = ['c1', 'c2', 'c3'];

function placement(
  label: string,
  lengthTenthsMm: number,
  widthTenthsMm: number,
  rotated = false,
): PlanPlacement {
  return { label, lengthTenthsMm, widthTenthsMm, xTenthsMm: 0, yTenthsMm: 0, rotated };
}

function sheet(...placements: PlanPlacement[]): PlanSheet {
  return { lengthTenthsMm: 27500, widthTenthsMm: 18500, utilization: 0.5, placements };
}

describe('buildPlanLegend', () => {
  it('numera as peças na ordem em que elas aparecem no plano', () => {
    const legend = buildPlanLegend(
      [sheet(placement('Lateral', 8000, 4000), placement('Fundo', 6000, 3000))],
      PALETTE,
    );

    expect(legend.placementPieces[0].map((piece) => piece.number)).toEqual([1, 2]);
    expect(legend.placementPieces[0].map((piece) => piece.label)).toEqual(['Lateral', 'Fundo']);
  });

  it('dá o mesmo número à mesma peça em chapas diferentes', () => {
    const legend = buildPlanLegend(
      [
        sheet(placement('Lateral', 8000, 4000), placement('Fundo', 6000, 3000)),
        sheet(placement('Lateral', 8000, 4000)),
      ],
      PALETTE,
    );

    expect(legend.placementPieces[1][0].number).toBe(1);
  });

  it('reconhece a peça girada como a mesma peça', () => {
    // A colocação guarda a medida já trocada; é o `rotated` que permite
    // recuperar a medida com que a peça foi cadastrada.
    const legend = buildPlanLegend(
      [sheet(placement('Lateral', 8000, 4000), placement('Lateral', 4000, 8000, true))],
      PALETTE,
    );

    const [first, second] = legend.placementPieces[0];
    expect(second.number).toBe(first.number);
    expect(second.lengthTenthsMm).toBe(8000);
    expect(second.widthTenthsMm).toBe(4000);
    expect(legend.sheetEntries[0]).toHaveLength(1);
    expect(legend.sheetEntries[0][0].count).toBe(2);
  });

  it('separa por número duas peças de mesma medida e rótulos diferentes', () => {
    const legend = buildPlanLegend(
      [sheet(placement('Lateral', 8000, 4000), placement('Divisória', 8000, 4000))],
      PALETTE,
    );

    const [first, second] = legend.placementPieces[0];
    expect(second.number).not.toBe(first.number);
    // ...mas a cor é da dimensão, e as duas têm a mesma.
    expect(second.color).toBe(first.color);
  });

  it('pinta a mesma dimensão da mesma cor, mesmo de lado trocado', () => {
    const legend = buildPlanLegend(
      [sheet(placement('Prateleira', 8000, 4000), placement('Travessa', 4000, 8000))],
      PALETTE,
    );

    const [first, second] = legend.placementPieces[0];
    expect(second.color).toBe(first.color);
  });

  it('dá cores diferentes a dimensões diferentes', () => {
    const legend = buildPlanLegend(
      [sheet(placement('A', 8000, 4000), placement('B', 6000, 3000))],
      PALETTE,
    );

    const [first, second] = legend.placementPieces[0];
    expect(second.color).not.toBe(first.color);
  });

  it('dá a volta na paleta quando há mais dimensões que cores', () => {
    // Sete cores para um número de dimensões sem teto. A volta é legível
    // porque cor não é o único canal: o número da peça continua único.
    const legend = buildPlanLegend(
      [
        sheet(
          placement('A', 1000, 1000),
          placement('B', 2000, 2000),
          placement('C', 3000, 3000),
          placement('D', 4000, 4000),
        ),
      ],
      PALETTE,
    );

    const colors = legend.placementPieces[0].map((piece) => piece.color);
    expect(colors).toEqual(['c1', 'c2', 'c3', 'c1']);
    expect(legend.placementPieces[0].map((piece) => piece.number)).toEqual([1, 2, 3, 4]);
  });

  it('conta quantas vezes cada peça cai na chapa, sem contar as das outras', () => {
    const legend = buildPlanLegend(
      [
        sheet(
          placement('Lateral', 8000, 4000),
          placement('Lateral', 8000, 4000),
          placement('Fundo', 6000, 3000),
        ),
        sheet(placement('Lateral', 8000, 4000)),
      ],
      PALETTE,
    );

    expect(legend.sheetEntries[0].map((entry) => [entry.number, entry.count])).toEqual([
      [1, 2],
      [2, 1],
    ]);
    expect(legend.sheetEntries[1].map((entry) => [entry.number, entry.count])).toEqual([[1, 1]]);
  });

  it('lista a legenda da chapa na ordem do número', () => {
    const legend = buildPlanLegend(
      [
        sheet(placement('Lateral', 8000, 4000), placement('Fundo', 6000, 3000)),
        sheet(placement('Fundo', 6000, 3000), placement('Lateral', 8000, 4000)),
      ],
      PALETTE,
    );

    expect(legend.sheetEntries[1].map((entry) => entry.number)).toEqual([1, 2]);
  });

  it('conta as dimensões separadas das peças', () => {
    // "Medida" é o retângulo, e duas peças de rótulos diferentes podem ter a
    // mesma: contar peças e chamar o número de medidas mentiria.
    const legend = buildPlanLegend(
      [
        sheet(
          placement('Lateral', 8000, 4000),
          placement('Divisória', 8000, 4000),
          placement('Travessa', 4000, 8000),
          placement('Fundo', 6000, 3000),
        ),
      ],
      PALETTE,
    );

    expect(legend.sheetEntries[0]).toHaveLength(4);
    expect(legend.dimensionCount).toBe(2);
  });

  it('não quebra num plano sem chapa nenhuma', () => {
    const legend = buildPlanLegend([], PALETTE);

    expect(legend.placementPieces).toEqual([]);
    expect(legend.sheetEntries).toEqual([]);
    expect(legend.dimensionCount).toBe(0);
  });
});

describe('pieceIdentity', () => {
  it('apresenta a peça pelo número seguido do rótulo', () => {
    expect(pieceIdentity({ number: 3, label: 'Lateral' })).toBe('3. Lateral');
  });

  it('apresenta pelo número a peça cadastrada sem rótulo', () => {
    // Inventar "Sem rótulo" acrescentaria uma palavra que não ajuda a achar o
    // pedaço na bancada — o número, sim, está desenhado nele.
    expect(pieceIdentity({ number: 3, label: '' })).toBe('3');
  });
});
