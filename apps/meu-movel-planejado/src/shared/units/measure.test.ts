import { describe, expect, it } from 'vitest';
import { millimetersToTenths, tenthsToMillimeters } from './measure';

/**
 * O décimo de milímetro é a unidade em que toda medida trafega e é persistida
 * (CONTEXT.md). Milímetro só existe na digitação e na tela, e é nesta fronteira
 * que a conversão acontece.
 */
describe('millimetersToTenths', () => {
  it('converte milímetro em décimo de milímetro', () => {
    expect(millimetersToTenths(2750)).toBe(27500);
  });

  it('devolve inteiro para a medida fracionária que motivou a unidade', () => {
    // 0,3 mm é o kerf default, e `0.3 * 10` em ponto flutuante dá
    // 2.9999999999999996: sem arredondar, o kerf entraria no banco como 2.
    expect(millimetersToTenths(0.3)).toBe(3);
  });
});

describe('tenthsToMillimeters', () => {
  it('converte décimo de milímetro em milímetro', () => {
    expect(tenthsToMillimeters(27500)).toBe(2750);
  });

  it('preserva a casa decimal do kerf', () => {
    expect(tenthsToMillimeters(3)).toBe(0.3);
  });
});
