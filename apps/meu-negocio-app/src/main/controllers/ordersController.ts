import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Order } from '@shared/types/order';
import type { OrdersService } from '../services/ordersService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import {
  deleteOrderResultToResponse,
  orderToResponse,
  setOrderStatusResultToResponse,
} from './responses/order.response';
import {
  createOrderSchema,
  orderStatusSchema,
  paymentAmountSchema,
  updateOrderSchema,
} from './schemas/orders.schema';

/**
 * Os canais de vendas. O fluxo — falta de estoque, transição de status, baixa e
 * estorno dentro de `repos.transaction` — é todo do `ordersService`; aqui ficam
 * as duas pontas da fronteira: `parseOrThrow` na entrada e o mapa
 * `entity → response` na saída.
 *
 * `setStatus` e `delete` devolvem um envelope (pedido + produtos com estoque
 * mexido); o mapper dele vive em `responses/order.response.ts`, que importa o
 * `productToResponse` do outro domínio — a pasta existe justamente para um
 * controller não precisar importar o outro.
 */
export function registerOrdersController(orders: OrdersService): void {
  handle(IPC_CHANNELS.ordersGetAll, (): Order[] => orders.list().map(orderToResponse));

  handle(IPC_CHANNELS.ordersAdd, (_event, data: unknown): Order =>
    orderToResponse(orders.create(parseOrThrow(createOrderSchema, data))),
  );

  handle(IPC_CHANNELS.ordersUpdate, (_event, id: unknown, data: unknown): Order =>
    orderToResponse(orders.update(parseId(id), parseOrThrow(updateOrderSchema, data))),
  );

  handle(IPC_CHANNELS.ordersSetStatus, (_event, id: unknown, newStatus: unknown) =>
    setOrderStatusResultToResponse(
      orders.setStatus(parseId(id), parseOrThrow(orderStatusSchema, newStatus)),
    ),
  );

  handle(IPC_CHANNELS.ordersSetPaymentAmount, (_event, id: unknown, amountPaid: unknown): Order =>
    orderToResponse(
      orders.setPaymentAmount(parseId(id), parseOrThrow(paymentAmountSchema, amountPaid)),
    ),
  );

  handle(IPC_CHANNELS.ordersDelete, (_event, id: unknown) =>
    deleteOrderResultToResponse(orders.delete(parseId(id))),
  );
}
