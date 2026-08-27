/**
 * O vocabulário de vendas do processo principal.
 *
 * `OrderEntity` e `OrderItemEntity` são estruturalmente quase idênticos a
 * `Order`/`OrderItem` de `@shared/types/order`, e o porquê do sufixo `Entity`
 * está em `domain/product.ts`. A diferença real é `OrderItemEntity.stockApplied`:
 * é a escrituração de estoque (`CONTEXT.md`) do item, e fica fora do `OrderItem`
 * que atravessa o IPC de propósito — com a entidade separada do response, essa
 * exclusão vira estrutura, não comentário.
 */
export type OrderStatusEntity = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type OrderItemEntity = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  /** Quanto deste item já foi baixado do estoque do produto. */
  stockApplied: number;
};

export type OrderEntity = {
  id: string;
  customerName: string;
  status: OrderStatusEntity;
  items: OrderItemEntity[];
  manualTotal?: number;
  amountPaid: number;
  createdAt: string;
  updatedAt: string;
};
