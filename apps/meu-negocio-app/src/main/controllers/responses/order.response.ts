import type {
  DeleteOrderResult as DeleteOrderResultResponse,
  SetOrderStatusResult as SetOrderStatusResultResponse,
} from '@shared/ipc/api';
import type { Order, OrderItem } from '@shared/types/order';
import type { OrderEntity, OrderItemEntity } from '../../domain/order';
import type {
  DeleteOrderResult as DeleteOrderResultEntity,
  SetOrderStatusResult as SetOrderStatusResultEntity,
} from '../../services/ordersService';

/**
 * `entity → response` de venda (README §2.5). Um mapper por nó que é **objeto** —
 * o pedido e o item —; `status` é união de literais e atravessa por atribuição
 * direta, porque aí o `tsc` já quebra sozinho quando uma variante aparece de um
 * lado só, que é a decisão que o mapper existiria para forçar.
 *
 * É aqui que `stockApplied` sai: o campo é escrituração de estoque interna
 * (`CONTEXT.md`), existe no `OrderItemEntity` e não no `OrderItem` que o renderer
 * recebe. Com o mapper, a exclusão é estrutura — não o comentário que a defendia
 * antes.
 */
export function orderItemToResponse(entity: OrderItemEntity): OrderItem {
  return {
    id: entity.id,
    productId: entity.productId,
    productName: entity.productName,
    quantity: entity.quantity,
    unitPrice: entity.unitPrice,
    unitCost: entity.unitCost,
  };
}

export function orderToResponse(entity: OrderEntity): Order {
  return {
    id: entity.id,
    customerName: entity.customerName,
    status: entity.status,
    items: entity.items.map(orderItemToResponse),
    amountPaid: entity.amountPaid,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    // `manualTotal` é opcional dos dois lados, e a chave só existe quando há
    // total manual. `manualTotal: entity.manualTotal` a criaria sempre, com
    // `undefined` dentro — o structured clone do IPC preserva a diferença, e
    // "sem total manual" deixaria de ser a ausência do campo para virar um
    // campo vazio.
    ...(entity.manualTotal === undefined ? {} : { manualTotal: entity.manualTotal }),
  };
}

/**
 * Os envelopes que `setStatus`/`delete` devolvem: o pedido mais os produtos cujo
 * estoque a transição mexeu. `updatedProducts` já é `Product[]` dos dois lados —
 * `Product` não tem entidade própria — e atravessa direto; só `order` passa por
 * `orderToResponse`.
 */
export function setOrderStatusResultToResponse(
  result: SetOrderStatusResultEntity,
): SetOrderStatusResultResponse {
  return {
    order: orderToResponse(result.order),
    updatedProducts: result.updatedProducts,
  };
}

export function deleteOrderResultToResponse(
  result: DeleteOrderResultEntity,
): DeleteOrderResultResponse {
  return {
    updatedProducts: result.updatedProducts,
  };
}
