import { describe, expect, it } from 'vitest';
import type { PlanPlacement, PlanSheet } from '@shared/types/plan';
import { buildPlanLegend } from './planLegend';
import { buildPlanPieceList } from './planPrint';

/**
 * A lista de peças da página de resumo. Ela é o que a legenda da tela **não**
 * é: a legenda fala de uma chapa por vez, porque na tela só há uma chapa por
 * vez; o resumo fala do serviço inteiro, porque quem o lê está decidindo se vai
 * para a máquina.
 *
 * É também o decodificador dos números que aparecem nas folhas seguintes, e por
 * isso a numeração precisa ser a mesma da tela — o resumo não renumera nada.
 */

const PALETTE = ['c1', 'c2', 'c3'];

function placement(label: string, lengthTenthsMm: number, widthTenthsMm: number): PlanPlacement {
  return { label, lengthTenthsMm, widthTenthsMm, xTenthsMm: 0, yTenthsMm: 0, rotated: false };
}

function sheet(...placements: PlanPlacement[]): PlanSheet {
  return { lengthTenthsMm: 27500, widthTenthsMm: 18500, utilization: 0.5, placements };
}

function pieceListOf(...sheets: PlanSheet[]) {
  return buildPlanPieceList(buildPlanLegend(sheets, PALETTE));
}

describe('buildPlanPieceList', () => {
  it('soma numa linha só a peça que se repete na mesma chapa', () => {
    const list = pieceListOf(
      sheet(placement('Lateral', 8000, 4000), placement('Lateral', 8000, 4000)),
    );

    expect(list.entries).toHaveLength(1);
    expect(list.entries[0].count).toBe(2);
  });

  it('soma a mesma peça através das chapas', () => {
    // É a diferença entre a legenda e o resumo: quem vai à loja precisa do
    // total do serviço, não de quantas cabem nesta folha.
    const list = pieceListOf(
      sheet(placement('Lateral', 8000, 4000), placement('Fundo', 6000, 3000)),
      sheet(placement('Lateral', 8000, 4000), placement('Lateral', 8000, 4000)),
    );

    expect(list.entries.map((entry) => [entry.label, entry.count])).toEqual([
      ['Lateral', 3],
      ['Fundo', 1],
    ]);
  });

  it('mantém a numeração da tela, e não renumera o resumo', () => {
    // O número impresso na peça, folhas adiante, é traduzido por esta lista:
    // renumerar aqui faria o papel discordar de si mesmo.
    const list = pieceListOf(
      sheet(placement('Lateral', 8000, 4000), placement('Fundo', 6000, 3000)),
    );

    expect(list.entries.map((entry) => entry.number)).toEqual([1, 2]);
  });

  it('ordena pelo número da peça, e não pela ordem de chegada da última chapa', () => {
    const list = pieceListOf(
      sheet(placement('Lateral', 8000, 4000), placement('Fundo', 6000, 3000)),
      sheet(placement('Fundo', 6000, 3000)),
    );

    expect(list.entries.map((entry) => entry.number)).toEqual([1, 2]);
  });

  it('separa duas peças de mesma medida e rótulos diferentes', () => {
    // Elas dividem a cor, porque a cor é da dimensão; o que não podem dividir é
    // a linha da lista, porque na bancada são dois pedaços com nomes diferentes.
    const list = pieceListOf(
      sheet(placement('Lateral', 8000, 4000), placement('Porta', 8000, 4000)),
    );

    expect(list.entries.map((entry) => entry.label)).toEqual(['Lateral', 'Porta']);
    expect(list.entries[0].color).toBe(list.entries[1].color);
  });

  it('conta o total de peças cortadas pela soma das quantidades', () => {
    // O total sai da própria lista: derivá-lo das colocações deixaria dois
    // números que podem discordar na mesma página.
    const list = pieceListOf(
      sheet(placement('Lateral', 8000, 4000), placement('Fundo', 6000, 3000)),
      sheet(placement('Lateral', 8000, 4000)),
    );

    expect(list.total).toBe(3);
  });

  it('devolve lista vazia quando nenhuma chapa foi usada', () => {
    const list = buildPlanPieceList(buildPlanLegend([], PALETTE));

    expect(list).toEqual({ entries: [], total: 0 });
  });
});
