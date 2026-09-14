import type { Product } from '@shared/types/product';

/** O que o formulário sabe de um item enquanto ele está sendo digitado. */
export interface ShortageItem {
  productId: string;
  quantity: string;
}

/**
 * O aviso de estoque do formulário de pedido, em frases prontas. Só avisa: o
 * pedido pode ser registrado sem saldo, e é a **conclusão** que exige estoque
 * (`ordersService.setStatus`). As duas contas precisam somar por produto pelo
 * mesmo motivo — o mesmo produto pode ocupar mais de uma linha, e conferir
 * linha a linha deixaria passar duas de 2 unidades com saldo 3.
 *
 * Linha ainda sem produto e produto fora do catálogo não têm saldo a conferir.
 */
export function findOrderShortages(items: ShortageItem[], products: Product[]): string[] {
  const requestedByProduct = new Map<string, number>();
  for (const item of items) {
    if (!item?.productId) continue;
    const current = requestedByProduct.get(item.productId) ?? 0;
    requestedByProduct.set(item.productId, current + (Number(item.quantity) || 0));
  }

  const shortages: string[] = [];
  for (const [productId, requested] of requestedByProduct) {
    const product = products.find((p) => p.id === productId);
    if (!product || requested <= product.stock) continue;
    shortages.push(`${product.name} (pedido ${requested}, disponível ${product.stock})`);
  }
  return shortages;
}
