import { describe, expect, it } from 'vitest';
import type { Product } from '@shared/types/product';
import { findOrderShortages } from './orderShortages';

function product(id: string, name: string, stock: number): Product {
  return {
    id,
    name,
    description: '',
    category: 'Geral',
    supplier: '',
    costPrice: 1,
    salePrice: 2,
    stock,
    minStock: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('findOrderShortages', () => {
  const products = [product('p1', 'Camiseta Azul', 3), product('p2', 'Boné', 10)];

  it('não acusa falta quando o estoque cobre o pedido', () => {
    expect(findOrderShortages([{ productId: 'p1', quantity: '3' }], products)).toEqual([]);
  });

  it('descreve a falta com o pedido e o disponível', () => {
    expect(findOrderShortages([{ productId: 'p1', quantity: '5' }], products)).toEqual([
      'Camiseta Azul (pedido 5, disponível 3)',
    ]);
  });

  it('soma o mesmo produto repetido em linhas diferentes', () => {
    const items = [
      { productId: 'p1', quantity: '2' },
      { productId: 'p1', quantity: '2' },
    ];
    expect(findOrderShortages(items, products)).toEqual(['Camiseta Azul (pedido 4, disponível 3)']);
  });

  it('ignora linha sem produto escolhido e produto fora do catálogo', () => {
    const items = [
      { productId: '', quantity: '99' },
      { productId: 'sumiu', quantity: '99' },
    ];
    expect(findOrderShortages(items, products)).toEqual([]);
  });

  it('trata quantidade vazia ou ilegível como zero', () => {
    const items = [
      { productId: 'p1', quantity: '' },
      { productId: 'p2', quantity: 'abc' },
    ];
    expect(findOrderShortages(items, products)).toEqual([]);
  });
});
