import { describe, expect, it } from 'vitest';
import { type LabelCandidate, fitPieceLabels } from './pieceLabels';

/**
 * O rótulo dentro da peça tem três degraus, e quem decide entre eles é a
 * **medida** do texto contra o retângulo — não uma estimativa por número de
 * caracteres, que erraria `Lateral` e `Prateleira inferior` em sentidos
 * opostos.
 *
 * O que estes testes prendem é o degrau: onde o rótulo inteiro cabe, onde ele
 * recua para o número, e onde nem o número cabe. A mesma regra decide na tela e
 * na folha, com escalas diferentes, e é por isso que ela é conferida aqui em
 * vez de dentro de um componente.
 */

/** Sete pixels por caractere: largura fictícia, estável e fácil de contar. */
const CHAR_PX = 7;
const measureTextWidth = (text: string) => text.length * CHAR_PX;

/** Meio pixel por décimo de milímetro — 20 px por centímetro desenhado. */
const SCALE = 0.05;

function candidate(lengthTenthsMm: number, widthTenthsMm: number): LabelCandidate {
  return {
    lengthTenthsMm,
    widthTenthsMm,
    identity: '1. Lateral',
    number: '1',
    measure: '800,0 × 400,0 mm',
  };
}

function fit(candidates: LabelCandidate[], scale = SCALE) {
  return fitPieceLabels(candidates, { scale, measureTextWidth });
}

describe('fitPieceLabels', () => {
  it('escreve rótulo e medida quando os dois cabem', () => {
    const labels = fit([candidate(8000, 4000)]);

    expect(labels[0]).toEqual({
      kind: 'full',
      identity: '1. Lateral',
      measure: '800,0 × 400,0 mm',
    });
  });

  it('recua para o número quando o texto é mais largo que a peça', () => {
    const labels = fit([candidate(2300, 4000)]);

    expect(labels[0]).toEqual({ kind: 'number', number: '1' });
  });

  it('mede o mais largo dos dois textos, e não só o rótulo', () => {
    // A identidade cabe sozinha nesta largura; a medida, que vai na linha de
    // baixo, não. Escrever só a de cima deixaria a peça meio rotulada.
    const narrow = { ...candidate(2000, 4000), identity: '1', measure: '1850,0 × 1850,0 mm' };

    expect(fit([narrow])[0]).toEqual({ kind: 'number', number: '1' });
  });

  it('recua para o número quando a peça não tem altura para duas linhas', () => {
    // Larga o bastante para o texto, baixa demais para empilhá-lo.
    const labels = fit([candidate(8000, 500)]);

    expect(labels[0]).toEqual({ kind: 'number', number: '1' });
  });

  it('não escreve nada na peça pequena demais até para o número', () => {
    const labels = fit([candidate(300, 150)]);

    expect(labels[0]).toEqual({ kind: 'none' });
  });

  it('escreve mais na folha do que na tela, pela mesma regra', () => {
    // O mesmo retângulo, desenhado maior: é a escala que muda o degrau, e é por
    // isso que o papel não pode ter uma regra própria.
    const piece = candidate(2300, 4000);

    expect(fit([piece], SCALE)[0].kind).toBe('number');
    expect(fit([piece], SCALE * 3)[0].kind).toBe('full');
  });

  it('não decide nada antes de a caixa ter sido medida', () => {
    // Escala zero é a caixa ainda sem largura: escrever ali seria escrever
    // sobre um desenho que ainda não tem tamanho.
    const labels = fit([candidate(8000, 4000)], 0);

    expect(labels).toEqual([{ kind: 'none' }]);
  });

  it('devolve um rótulo por peça, na mesma ordem', () => {
    const labels = fit([candidate(8000, 4000), candidate(300, 150), candidate(2300, 4000)]);

    expect(labels.map((label) => label.kind)).toEqual(['full', 'none', 'number']);
  });
});
