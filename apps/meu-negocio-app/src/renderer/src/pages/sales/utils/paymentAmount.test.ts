import { describe, expect, it } from 'vitest';
import { clampPaymentAmount } from './paymentAmount';

describe('clampPaymentAmount', () => {
  it('aceita um valor dentro do total', () => {
    expect(clampPaymentAmount('150', 400)).toBe(150);
    expect(clampPaymentAmount('150.5', 400)).toBe(150.5);
  });

  it('substitui o acumulado em vez de somar uma parcela', () => {
    // R$ 100 já pagos e o campo recebe 150: o total pago passa a ser 150.
    expect(clampPaymentAmount('150', 400)).toBe(150);
  });

  it('não deixa passar do total do pedido', () => {
    expect(clampPaymentAmount('500', 400)).toBe(400);
  });

  it('não aceita valor negativo', () => {
    expect(clampPaymentAmount('-10', 400)).toBe(0);
  });

  it('trata campo vazio ou ilegível como zero', () => {
    expect(clampPaymentAmount('', 400)).toBe(0);
    expect(clampPaymentAmount('abc', 400)).toBe(0);
  });
});
