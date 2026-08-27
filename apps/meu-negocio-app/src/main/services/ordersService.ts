import type { CreateOrderData, UpdateOrderData } from '@shared/types/order';
import type { OrderEntity, OrderStatusEntity } from '../domain/order';
import type { ProductEntity } from '../domain/product';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';

export interface SetOrderStatusResult {
  order: OrderEntity;
  updatedProducts: ProductEntity[];
}

export interface DeleteOrderResult {
  updatedProducts: ProductEntity[];
}

/**
 * A regra de negócio de vendas: falta de estoque, baixa, estorno e o clamp em
 * zero do saldo — tudo que antes morava dentro de `ordersRepository.ts`
 * misturado com SQL. O repositório agora só tem verbos; a decisão está aqui.
 */
export function makeOrdersService(repos: Repositories) {
  /**
   * O que falta em estoque para concluir o pedido. Soma por produto, porque o
   * mesmo produto pode aparecer em mais de um item. Produto removido do
   * catálogo não tem saldo a conferir nem a movimentar.
   */
  function stockShortages(order: OrderEntity): string[] {
    const requiredByProduct = new Map<string, number>();
    for (const item of order.items) {
      requiredByProduct.set(
        item.productId,
        (requiredByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const shortages: string[] = [];
    for (const [productId, required] of requiredByProduct) {
      const product = repos.products.findById(productId);
      if (!product) continue;
      if (product.stock < required) {
        shortages.push(`${product.name} (necessário ${required}, disponível ${product.stock})`);
      }
    }
    return shortages;
  }

  /**
   * Move o saldo de um produto e diz quanto de fato se moveu. O saldo para em
   * zero em vez de ficar negativo — e quem chamou precisa saber da diferença
   * para estornar depois exatamente o que saiu. Era o clamp de
   * `adjustProductStock` no `productsRepository` (decisão 5 da spec); agora o
   * service fala com `repos.products` direto, sem repositório chamar repositório.
   */
  function moveProductStock(
    productId: string,
    delta: number,
  ): { product: ProductEntity; appliedDelta: number } | null {
    const existing = repos.products.findById(productId);
    if (!existing) return null;

    const stock = Math.max(0, existing.stock + delta);
    const product = repos.products.update(productId, { stock });
    if (!product) return null;
    return { product, appliedDelta: stock - existing.stock };
  }

  /**
   * Baixa do estoque a quantidade de cada item e registra quanto saiu de fato
   * — que é menos que o pedido quando o saldo não cobria.
   */
  function deductStock(order: OrderEntity): ProductEntity[] {
    const updated: ProductEntity[] = [];
    for (const item of order.items) {
      const moved = moveProductStock(item.productId, -item.quantity);
      if (moved) updated.push(moved.product);
      repos.orders.setItemStockApplied(item.id, -(moved?.appliedDelta ?? 0));
    }
    return updated;
  }

  /**
   * Devolve ao estoque exatamente o que a conclusão tirou. Serve para reabrir,
   * cancelar ou excluir uma venda.
   */
  function restoreStock(order: OrderEntity): ProductEntity[] {
    const updated: ProductEntity[] = [];
    for (const item of order.items) {
      const moved = moveProductStock(item.productId, item.stockApplied);
      if (moved) updated.push(moved.product);
      repos.orders.setItemStockApplied(item.id, 0);
    }
    return updated;
  }

  const orderNotFound = (id: string): AppError => new AppError(404, `Pedido não encontrado: ${id}`);

  function requireOrder(id: string): OrderEntity {
    const order = repos.orders.findById(id);
    if (!order) throw orderNotFound(id);
    return order;
  }

  return {
    list(): OrderEntity[] {
      return repos.orders.list();
    },

    create(data: CreateOrderData): OrderEntity {
      return repos.orders.create(data);
    },

    update(id: string, data: UpdateOrderData): OrderEntity {
      const existing = requireOrder(id);

      // A edição troca todos os itens do pedido. Numa venda concluída isso
      // apagaria o registro do que já saiu do estoque, deixando o saldo sem
      // como voltar; num pedido cancelado, editar não faz sentido.
      if (existing.status === 'completed') {
        throw new AppError(
          409,
          'Não é possível editar uma venda concluída. Reabra o pedido na tela de Vendas para poder editá-lo.',
        );
      }
      if (existing.status === 'cancelled') {
        throw new AppError(409, 'Não é possível editar um pedido cancelado.');
      }

      const updated = repos.orders.update(id, data);
      if (!updated) throw orderNotFound(id);
      return updated;
    },

    /**
     * A prova de fogo do desenho: transição de status, falta de estoque, baixa
     * e estorno rodam dentro de `repos.transaction`, mas autorados aqui, não no
     * repositório. Forçar uma falha de estoque no meio de uma conclusão não
     * pode deixar produto com baixa parcial — o `throw` faz rollback de tudo.
     */
    setStatus(id: string, newStatus: OrderStatusEntity): SetOrderStatusResult {
      const existing = requireOrder(id);

      return repos.transaction(() => {
        const updatedProducts: ProductEntity[] = [];
        const wasCompleted = existing.status === 'completed';
        const isNowCompleted = newStatus === 'completed';

        if (wasCompleted !== isNowCompleted) {
          if (isNowCompleted) {
            const shortages = stockShortages(existing);
            if (shortages.length > 0) {
              throw new AppError(
                409,
                `Estoque insuficiente para concluir o pedido: ${shortages.join('; ')}. ` +
                  'Reponha o estoque ou ajuste as quantidades do pedido.',
              );
            }
            updatedProducts.push(...deductStock(existing));
          } else {
            updatedProducts.push(...restoreStock(existing));
          }
        }

        const order = repos.orders.setStatus(id, newStatus);
        if (!order) throw orderNotFound(id);
        return { order, updatedProducts };
      });
    },

    setPaymentAmount(id: string, amountPaid: number): OrderEntity {
      const order = repos.orders.setPaymentAmount(id, amountPaid);
      if (!order) throw orderNotFound(id);
      return order;
    },

    /**
     * Ausência agora é `AppError(404)` — antes silenciava, devolvendo sucesso
     * vazio (decisão 4 da spec). Se a venda estava concluída, o estoque volta
     * antes de ela sumir, na mesma transação.
     */
    delete(id: string): DeleteOrderResult {
      const existing = requireOrder(id);

      return repos.transaction(() => {
        const updatedProducts: ProductEntity[] = [];
        if (existing.status === 'completed') {
          updatedProducts.push(...restoreStock(existing));
        }
        repos.orders.delete(id);
        return { updatedProducts };
      });
    },
  };
}

export type OrdersService = ReturnType<typeof makeOrdersService>;
