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
import { productToResponse } from './product.response';

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
 * estoque a transição mexeu. São nós que são objeto e atravessam o IPC, então
 * têm mapper próprio (README §2.5) — o `updatedProducts` do lado da entidade é
 * `ProductEntity[]`, o do response é `Product[]`. É aqui que o
 * `productToResponse` de outro domínio entra, na pasta que existe para isso.
 */
export function setOrderStatusResultToResponse(
  result: SetOrderStatusResultEntity,
): SetOrderStatusResultResponse {
  return {
    order: orderToResponse(result.order),
    updatedProducts: result.updatedProducts.map(productToResponse),
  };
}

export function deleteOrderResultToResponse(
  result: DeleteOrderResultEntity,
): DeleteOrderResultResponse {
  return {
    updatedProducts: result.updatedProducts.map(productToResponse),
  };
}
