/**
 * O vocabulário de vendas do processo principal.
 *
 * O sufixo `Entity` existe porque a forma do domínio e o contrato que
 * atravessa o IPC são peças diferentes, mesmo quando hoje têm os mesmos
 * campos: uma é o vocabulário do processo principal, a outra é o que o
 * renderer recebe, e nada garante que continuem iguais. Sem nomes diferentes,
 * o TypeScript não pegaria a troca de uma pela outra num mapper que lida com
 * as duas ao mesmo tempo.
 *
 * `OrderEntity` e `OrderItemEntity` são a prova viva disso: `Order`/`OrderItem`
 * de `@shared/types/order` quase batem, mas `OrderItemEntity.stockApplied` não
 * tem par do outro lado — é a escrituração de estoque (`CONTEXT.md`) do item, e
 * fica fora do `OrderItem` que atravessa o IPC de propósito. Com a entidade
 * separada do response, essa exclusão vira estrutura, não comentário.
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
