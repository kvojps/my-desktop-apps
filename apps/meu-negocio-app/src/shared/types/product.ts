export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  supplier: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

/** Quanto sobra em cada unidade vendida. */
export function getProductUnitProfit(product: Product): number {
  return product.salePrice - product.costPrice;
}

/**
 * Margem sobre o preço de venda, em pontos percentuais — a mesma base usada nos
 * cards de lucro, para os dois números serem comparáveis. Sem preço de venda a
 * margem é indefinida, e não zero: um produto sem preço não tem margem ruim,
 * tem margem desconhecida.
 */
export function getProductMargin(product: Product): number | undefined {
  if (product.salePrice <= 0) return undefined;
  return (getProductUnitProfit(product) / product.salePrice) * 100;
}

/** Capital parado na prateleira: custo do que está em estoque. */
export function getProductStockValue(product: Product): number {
  return product.costPrice * product.stock;
}
