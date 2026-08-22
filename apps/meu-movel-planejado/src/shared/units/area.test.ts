import { describe, expect, it } from 'vitest';
import { tenthsMm2ToSquareMeters, totalAreaTenthsMm2 } from './area';

/**
 * A área herda a unidade das medidas: décimo de milímetro ao quadrado, sempre
 * inteiro. Metro quadrado só existe na tela — é a unidade em que o marceneiro
 * compara o serviço com o estoque, e em que o déficit vai ser reportado.
 */
describe('totalAreaTenthsMm2', () => {
  it('multiplica a medida pela quantidade do lote', () => {
    // Uma peça de 100 × 50 mm, quatro vezes.
    expect(totalAreaTenthsMm2([{ lengthTenthsMm: 1000, widthTenthsMm: 500, quantity: 4 }])).toBe(
      2_000_000,
    );
  });

  it('soma lotes de medidas diferentes', () => {
    const total = totalAreaTenthsMm2([
      { lengthTenthsMm: 1000, widthTenthsMm: 500, quantity: 4 },
      { lengthTenthsMm: 2000, widthTenthsMm: 1000, quantity: 1 },
    ]);
    expect(total).toBe(4_000_000);
  });

  it('devolve zero para projeto sem nada cadastrado', () => {
    expect(totalAreaTenthsMm2([])).toBe(0);
  });
});

describe('tenthsMm2ToSquareMeters', () => {
  it('converte um metro quadrado exato', () => {
    // 1000 × 1000 mm = 10000 × 10000 décimos.
    expect(tenthsMm2ToSquareMeters(100_000_000)).toBe(1);
  });

  it('converte a chapa inteira de 2750 × 1850 mm', () => {
    const chapa = totalAreaTenthsMm2([
      { lengthTenthsMm: 27500, widthTenthsMm: 18500, quantity: 1 },
    ]);
    expect(tenthsMm2ToSquareMeters(chapa)).toBeCloseTo(5.0875, 4);
  });
});
