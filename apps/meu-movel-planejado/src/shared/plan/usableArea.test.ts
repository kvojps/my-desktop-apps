import { describe, expect, it } from 'vitest';
import { usableArea } from './usableArea';

/**
 * A área útil é o que os dois desenhos hachuram — o da tela e o da folha. O que
 * estes testes prendem é que ela desconta o refile de **cada** borda, e que ela
 * nunca vira um retângulo negativo quando o refile é grande demais para a chapa.
 */

describe('usableArea', () => {
  it('desconta o refile das duas bordas de cada eixo', () => {
    const area = usableArea({ lengthTenthsMm: 27500, widthTenthsMm: 18500 }, 100);

    expect(area).toEqual({
      originTenthsMm: 100,
      lengthTenthsMm: 27300,
      widthTenthsMm: 18300,
    });
  });

  it('devolve a chapa inteira quando a oficina não refila', () => {
    const area = usableArea({ lengthTenthsMm: 10000, widthTenthsMm: 5000 }, 0);

    expect(area).toEqual({ originTenthsMm: 0, lengthTenthsMm: 10000, widthTenthsMm: 5000 });
  });

  it('não devolve lado negativo quando o refile come a chapa toda', () => {
    // Um retângulo de lado negativo desenharia de trás para frente, e o `<rect>`
    // do SVG simplesmente some. Zero é o que ele é: não sobrou área útil.
    const area = usableArea({ lengthTenthsMm: 1000, widthTenthsMm: 400 }, 600);

    expect(area.lengthTenthsMm).toBe(0);
    expect(area.widthTenthsMm).toBe(0);
  });
});
