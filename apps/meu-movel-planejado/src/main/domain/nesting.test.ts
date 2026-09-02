import { describe, expect, it } from 'vitest';
import { fitsAnySheet } from '../../shared/nesting/fit';
import {
  type CuttingPlanEntity,
  type NestingPlacementEntity,
  type NestingSheetEntity,
  type PackablePieceEntity,
  type PackableSheetEntity,
  packCuttingPlan,
} from './nesting';

/**
 * O único seam de teste da feature. O que se verifica aqui é o que o usuário vê
 * do plano — quantas chapas, onde as peças caíram, o que ficou de fora, quanto
 * falta — e nunca a mecânica do empacotador: trocar a heurística não pode
 * quebrar um teste destes, desde que os planos continuem válidos.
 *
 * Toda medida é décimo de milímetro: uma chapa de 10000 × 10000 é uma chapa de
 * um metro por um metro.
 */

function piece(id: string, length: number, width: number, quantity = 1): PackablePieceEntity {
  return { id, label: id, lengthTenthsMm: length, widthTenthsMm: width, quantity };
}

function sheet(id: string, length: number, width: number, quantity = 1): PackableSheetEntity {
  return { id, lengthTenthsMm: length, widthTenthsMm: width, quantity };
}

/** Kerf e refile partem de zero, para que cada teste declare só o que exercita. */
function plan(input: {
  pieces?: PackablePieceEntity[];
  sheets?: PackableSheetEntity[];
  kerfTenthsMm?: number;
  trimTenthsMm?: number;
}): CuttingPlanEntity {
  return packCuttingPlan({
    pieces: input.pieces ?? [],
    sheets: input.sheets ?? [],
    kerfTenthsMm: input.kerfTenthsMm ?? 0,
    trimTenthsMm: input.trimTenthsMm ?? 0,
  });
}

function placementCount(result: CuttingPlanEntity): number {
  return result.sheets.reduce((total, planned) => total + planned.placements.length, 0);
}

/** Todo par de colocações de uma chapa planejada, cada par uma vez. */
function pairs(planned: NestingSheetEntity): [NestingPlacementEntity, NestingPlacementEntity][] {
  const result: [NestingPlacementEntity, NestingPlacementEntity][] = [];
  for (let i = 0; i < planned.placements.length; i += 1) {
    for (let j = i + 1; j < planned.placements.length; j += 1) {
      result.push([planned.placements[i], planned.placements[j]]);
    }
  }
  return result;
}

/**
 * A distância entre duas colocações no eixo em que elas mais se afastam.
 * Negativa quando elas se sobrepõem — o que nenhum plano pode produzir.
 */
function gap(a: NestingPlacementEntity, b: NestingPlacementEntity): number {
  const horizontal = Math.max(
    a.xTenthsMm - (b.xTenthsMm + b.lengthTenthsMm),
    b.xTenthsMm - (a.xTenthsMm + a.lengthTenthsMm),
  );
  const vertical = Math.max(
    a.yTenthsMm - (b.yTenthsMm + b.widthTenthsMm),
    b.yTenthsMm - (a.yTenthsMm + a.widthTenthsMm),
  );
  return Math.max(horizontal, vertical);
}

describe('packCuttingPlan', () => {
  describe('ladrilhamento exato', () => {
    it('coloca numa chapa só as quatro peças que a preenchem, com kerf zero', () => {
      const result = plan({
        pieces: [piece('meia', 5000, 5000, 4)],
        sheets: [sheet('inteira', 10000, 10000)],
      });

      expect(result.sheets).toHaveLength(1);
      expect(result.sheets[0].placements).toHaveLength(4);
      expect(result.sheets[0].utilization).toBe(1);
      expect(result.utilization).toBe(1);
      expect(result.unplaced).toEqual([]);
      expect(result.rejected).toEqual([]);
      expect(result.deficit.areaTenthsMm2).toBe(0);
    });

    it('desdobra a quantidade do lote em uma colocação por peça', () => {
      const result = plan({
        pieces: [piece('prateleira', 2000, 1000, 7)],
        sheets: [sheet('inteira', 10000, 10000)],
      });

      expect(placementCount(result)).toBe(7);
      for (const placement of result.sheets[0].placements) {
        expect(placement.pieceId, JSON.stringify(placement)).toBe('prateleira');
      }
    });
  });

  describe('kerf', () => {
    it('tira da chapa o ladrilhamento que só fechava com folga zero', () => {
      const exato = {
        pieces: [piece('meia', 5000, 5000, 4)],
        sheets: [sheet('inteira', 10000, 10000, 4)],
      };

      expect(plan(exato).sheets).toHaveLength(1);
      // A mesma entrada com a fresa de 0,3 mm. Peça que ocupa metade exata do
      // eixo não admite vizinha nenhuma depois do kerf: as quatro que dividiam
      // uma chapa passam a ocupar uma chapa cada.
      expect(plan({ ...exato, kerfTenthsMm: 3 }).sheets).toHaveLength(4);
    });

    it('cobra uma chapa a mais quando come a última peça de cada fileira', () => {
      // Três por fileira com folga zero, duas com a fresa: as nove que cabiam
      // numa chapa viram quatro, e as seis do serviço passam a pedir duas.
      const servico = {
        pieces: [piece('porta', 3330, 3330, 6)],
        sheets: [sheet('inteira', 10000, 10000, 3)],
      };

      expect(plan(servico).sheets).toHaveLength(1);

      const comKerf = plan({ ...servico, kerfTenthsMm: 3 });
      expect(comKerf.sheets).toHaveLength(2);
      expect(comKerf.unplaced).toEqual([]);
    });

    it('não coloca a peça do tamanho exato da chapa, porque a folga vale contra a borda', () => {
      const tampo = {
        pieces: [piece('tampo', 10000, 10000)],
        sheets: [sheet('inteira', 10000, 10000)],
      };

      expect(placementCount(plan(tampo))).toBe(1);

      // Um kerf maior que zero já é um lado a menos na peça mais externa.
      const comKerf = plan({ ...tampo, kerfTenthsMm: 1 });
      expect(placementCount(comKerf)).toBe(0);
      expect(comKerf.rejected).toEqual([
        {
          pieceId: 'tampo',
          label: 'tampo',
          lengthTenthsMm: 10000,
          widthTenthsMm: 10000,
          quantity: 1,
        },
      ]);
    });

    it('deixa um kerf de folga entre peças vizinhas e contra a borda útil', () => {
      const kerfTenthsMm = 3;
      const trimTenthsMm = 100;
      const result = plan({
        pieces: [piece('lateral', 2000, 1500, 6), piece('fundo', 3000, 2500, 3)],
        sheets: [sheet('inteira', 10000, 10000)],
        kerfTenthsMm,
        trimTenthsMm,
      });

      expect(placementCount(result)).toBe(9);
      for (const planned of result.sheets) {
        for (const placement of planned.placements) {
          const onde = JSON.stringify(placement);
          expect(placement.xTenthsMm, onde).toBeGreaterThanOrEqual(trimTenthsMm + kerfTenthsMm);
          expect(placement.yTenthsMm, onde).toBeGreaterThanOrEqual(trimTenthsMm + kerfTenthsMm);
          expect(placement.xTenthsMm + placement.lengthTenthsMm, onde).toBeLessThanOrEqual(
            planned.lengthTenthsMm - trimTenthsMm - kerfTenthsMm,
          );
          expect(placement.yTenthsMm + placement.widthTenthsMm, onde).toBeLessThanOrEqual(
            planned.widthTenthsMm - trimTenthsMm - kerfTenthsMm,
          );
        }
        for (const [a, b] of pairs(planned)) {
          const par = `${JSON.stringify(a)} x ${JSON.stringify(b)}`;
          expect(gap(a, b), par).toBeGreaterThanOrEqual(kerfTenthsMm);
        }
      }
    });
  });

  describe('refile', () => {
    it('reduz a área útil na medida declarada, dos dois lados', () => {
      // 50 mm de refile por borda tiram 100 mm de cada eixo da chapa de um metro.
      const result = plan({
        pieces: [piece('tampo', 9000, 9000)],
        sheets: [sheet('inteira', 10000, 10000)],
        trimTenthsMm: 500,
      });

      expect(placementCount(result)).toBe(1);
      expect(result.sheets[0].placements[0].xTenthsMm).toBe(500);
      expect(result.sheets[0].placements[0].yTenthsMm).toBe(500);
      // Aproveitamento é fração da área útil, não da chapa: a peça a preenche.
      expect(result.sheets[0].utilization).toBe(1);
    });

    it('deixa de fora a peça que passa da área útil por um décimo de milímetro', () => {
      const result = plan({
        pieces: [piece('tampo', 9001, 9000)],
        sheets: [sheet('inteira', 10000, 10000)],
        trimTenthsMm: 500,
      });

      expect(placementCount(result)).toBe(0);
    });
  });

  describe('rotação', () => {
    it('gira a peça em 90° quando é a única forma de ela caber', () => {
      const result = plan({
        pieces: [piece('travessa', 2500, 9000)],
        sheets: [sheet('retalho', 10000, 3000)],
      });

      expect(placementCount(result)).toBe(1);
      const [placement] = result.sheets[0].placements;
      expect(placement.rotated).toBe(true);
      expect(placement.lengthTenthsMm).toBe(9000);
      expect(placement.widthTenthsMm).toBe(2500);
    });
  });

  describe('ordem de consumo das chapas', () => {
    it('consome o retalho antes da chapa inteira', () => {
      const result = plan({
        pieces: [piece('lateral', 5000, 5000)],
        sheets: [sheet('inteira', 27500, 18500), sheet('retalho', 6000, 6000)],
      });

      expect(result.sheets).toHaveLength(1);
      expect(result.sheets[0].sheetId).toBe('retalho');
    });

    it('não planeja a chapa em que nada coube', () => {
      // O retalho não comporta a peça; ele não vira chapa planejada, e continua
      // inteiro na parede.
      const result = plan({
        pieces: [piece('lateral', 8000, 8000)],
        sheets: [sheet('inteira', 27500, 18500), sheet('retalho', 3000, 3000)],
      });

      expect(result.sheets.map((planned) => planned.sheetId)).toEqual(['inteira']);
    });
  });

  describe('estoque insuficiente', () => {
    it('deixa de fora as peças que não couberam e mede o que falta', () => {
      const result = plan({
        pieces: [piece('meia', 5000, 5000, 4), piece('menor', 4000, 4000, 2)],
        sheets: [sheet('inteira', 10000, 10000)],
      });

      expect(result.unplaced).toEqual([
        {
          pieceId: 'menor',
          label: 'menor',
          lengthTenthsMm: 4000,
          widthTenthsMm: 4000,
          quantity: 2,
        },
      ]);
      expect(result.rejected).toEqual([]);
      // Duas peças de 400 × 400 mm: 0,16 m² cada.
      expect(result.deficit.areaTenthsMm2).toBe(32_000_000);
      expect(result.deficit.squareMeters).toBeCloseTo(0.32, 6);
      expect(result.deficit.referenceSheet).toEqual({
        lengthTenthsMm: 10000,
        widthTenthsMm: 10000,
      });
      expect(result.deficit.atLeastSheets).toBe(1);
    });

    it('ainda mostra o que dá para cortar hoje', () => {
      const result = plan({
        pieces: [piece('meia', 5000, 5000, 6)],
        sheets: [sheet('inteira', 10000, 10000)],
      });

      expect(placementCount(result)).toBe(4);
      expect(result.unplaced).toEqual([
        { pieceId: 'meia', label: 'meia', lengthTenthsMm: 5000, widthTenthsMm: 5000, quantity: 2 },
      ]);
    });

    it('arredonda a equivalência para cima, porque chapa não se compra pela metade', () => {
      const result = plan({
        pieces: [piece('tampo', 9000, 9000, 3)],
        sheets: [sheet('inteira', 10000, 10000)],
      });

      expect(result.deficit.areaTenthsMm2).toBe(2 * 9000 * 9000);
      expect(result.deficit.atLeastSheets).toBe(2);
    });

    it('conta a peça que falta já acrescida do kerf que ela consome ao redor', () => {
      // O que falta comprar não é a peça: é o retângulo que ela ocupa na chapa,
      // fresa inclusa. Com 1 mm de kerf, a peça de 100 × 100 mm custa
      // 101 × 101 mm de material. As quatro maiores enchem a chapa exatamente.
      const result = plan({
        pieces: [piece('meia', 4985, 4985, 4), piece('menor', 1000, 1000, 2)],
        sheets: [sheet('inteira', 10000, 10000)],
        kerfTenthsMm: 10,
      });

      expect(result.unplaced).toEqual([
        {
          pieceId: 'menor',
          label: 'menor',
          lengthTenthsMm: 1000,
          widthTenthsMm: 1000,
          quantity: 2,
        },
      ]);
      expect(result.deficit.areaTenthsMm2).toBe(2 * 1010 * 1010);
    });

    it('traduz o déficit pela área em que a chapa de fato empacota, e não pela bruta', () => {
      // Chapa de um metro com 50 mm de refile e 10 mm de kerf: o empacotamento
      // roda em 890 mm por eixo, não em 1000. O déficit de duas peças passa do
      // que uma chapa comporta, e a conta pela medida bruta — ou pela área útil
      // sem descontar a fresa — diria que uma chapa basta.
      const result = plan({
        pieces: [piece('porta', 6225, 6225, 3)],
        sheets: [sheet('inteira', 10000, 10000)],
        kerfTenthsMm: 100,
        trimTenthsMm: 500,
      });

      expect(result.unplaced).toEqual([
        {
          pieceId: 'porta',
          label: 'porta',
          lengthTenthsMm: 6225,
          widthTenthsMm: 6225,
          quantity: 2,
        },
      ]);
      expect(result.deficit.areaTenthsMm2).toBe(2 * 6325 * 6325);
      // 80,01 M contra os 79,21 M de 8900²: passa de uma chapa por pouco, e é
      // esse "por pouco" que a palavra "pelo menos" cobre.
      expect(result.deficit.atLeastSheets).toBe(2);
    });
  });

  describe('melhor de várias tentativas', () => {
    it('acha o arranjo de uma chapa que a primeira tentativa não acha', () => {
      // As peças cabem todas numa chapa, mas não em qualquer arranjo: ordenar
      // por área decrescente e encaixar pelo lado curto deixa uma peça de fora.
      // Outra combinação de ordenação e critério fecha em uma chapa só, e é o
      // plano que o app tem de entregar.
      const result = plan({
        pieces: [
          piece('lateral', 14700, 3000, 4),
          piece('prateleira', 13500, 2700, 2),
          piece('travessa', 15600, 1150, 4),
          piece('fundo', 2900, 5800, 2),
        ],
        sheets: [sheet('inteira', 27500, 18500, 3)],
        kerfTenthsMm: 3,
      });

      expect(result.sheets).toHaveLength(1);
      expect(placementCount(result)).toBe(12);
      expect(result.unplaced).toEqual([]);
    });
  });

  describe('rejeição', () => {
    it('rejeita a peça maior que qualquer chapa do projeto', () => {
      const result = plan({
        pieces: [piece('bancada', 30000, 5000), piece('meia', 5000, 5000, 2)],
        sheets: [sheet('inteira', 10000, 10000)],
      });

      expect(result.rejected).toEqual([
        {
          pieceId: 'bancada',
          label: 'bancada',
          lengthTenthsMm: 30000,
          widthTenthsMm: 5000,
          quantity: 1,
        },
      ]);
      expect(placementCount(result)).toBe(2);
    });

    it('não conta a peça rejeitada no déficit nem na compra', () => {
      // Comprar mais chapas do mesmo formato não faria a peça caber: somá-la
      // aqui recomendaria uma compra inútil.
      const result = plan({
        pieces: [piece('bancada', 30000, 5000)],
        sheets: [sheet('inteira', 10000, 10000)],
      });

      expect(result.unplaced).toEqual([]);
      expect(result.deficit.areaTenthsMm2).toBe(0);
      expect(result.deficit.atLeastSheets).toBe(0);
    });
  });

  describe('determinismo', () => {
    it('devolve o mesmo plano para a mesma entrada', () => {
      const projeto = {
        pieces: [
          piece('lateral', 2400, 5800, 4),
          piece('prateleira', 2340, 4000, 6),
          piece('fundo', 5800, 4000, 2),
          piece('porta', 1170, 5800, 4),
        ],
        sheets: [sheet('inteira', 27500, 18500, 2), sheet('retalho', 12000, 8000)],
        kerfTenthsMm: 3,
        trimTenthsMm: 100,
      };

      expect(plan(projeto)).toEqual(plan(projeto));
    });
  });

  describe('projeto vazio', () => {
    it('devolve plano vazio quando não há peça nem chapa', () => {
      const result = plan({});

      expect(result.sheets).toEqual([]);
      expect(result.utilization).toBe(0);
      expect(result.unplaced).toEqual([]);
      expect(result.rejected).toEqual([]);
      expect(result.deficit.areaTenthsMm2).toBe(0);
      expect(result.deficit.referenceSheet).toBeNull();
      expect(result.deficit.atLeastSheets).toBe(0);
    });

    it('devolve plano vazio quando há chapa e nenhuma peça', () => {
      const result = plan({ sheets: [sheet('inteira', 10000, 10000)] });

      expect(result.sheets).toEqual([]);
      expect(result.utilization).toBe(0);
      expect(result.deficit.areaTenthsMm2).toBe(0);
    });

    it('trata projeto sem chapa como falta de estoque, e não como rejeição', () => {
      // Sem chapa nenhuma não há com o que comparar a peça, e comprar chapa
      // resolve — que é exatamente a definição de peça não alocada.
      const result = plan({ pieces: [piece('lateral', 5000, 5000, 2)] });

      expect(result.rejected).toEqual([]);
      expect(result.unplaced).toEqual([
        {
          pieceId: 'lateral',
          label: 'lateral',
          lengthTenthsMm: 5000,
          widthTenthsMm: 5000,
          quantity: 2,
        },
      ]);
      expect(result.deficit.areaTenthsMm2).toBe(2 * 5000 * 5000);
      // Sem formato de chapa, não há em quantas chapas traduzir o déficit.
      expect(result.deficit.referenceSheet).toBeNull();
      expect(result.deficit.atLeastSheets).toBe(0);
    });
  });
});

/**
 * A régua da rejeição isolada — `fitsAnySheet`, que fica em `shared/nesting/fit`
 * porque o cadastro de peça a consulta sem gerar plano — confrontada com a lista
 * de rejeitadas do próprio empacotador. Veio de `fit.test.ts` no ticket 07: é do
 * lado do empacotador que as duas leituras se encontram, e o empacotador mudou
 * de lado.
 */
describe('a régua da rejeição concorda com o empacotador', () => {
  it('responde o mesmo que a lista de rejeitadas do empacotador', () => {
    const geometry = { kerfTenthsMm: 3, trimTenthsMm: 100 };
    const sheets = [
      { lengthTenthsMm: 4000, widthTenthsMm: 3000 },
      { lengthTenthsMm: 27500, widthTenthsMm: 18500 },
    ];
    const pieces = [
      { id: 'cabe', label: 'lateral', lengthTenthsMm: 20000, widthTenthsMm: 6000, quantity: 1 },
      { id: 'gigante', label: 'tampo', lengthTenthsMm: 30000, widthTenthsMm: 6000, quantity: 1 },
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
