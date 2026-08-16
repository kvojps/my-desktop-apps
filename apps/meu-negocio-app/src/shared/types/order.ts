export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  manualTotal?: number;
  amountPaid: number;
  /**
   * Data do pedido, escolhida pelo usuário no formulário — quem lança hoje os
   * pedidos do fim de semana, ou migra um caderno de anotações para o app,
   * precisa que cada um caia no mês em que aconteceu. Ausente na criação,
   * assume o momento atual. É também a data pela qual a venda é contabilizada
   * quando o pedido é concluído.
   */
  createdAt: string;
  updatedAt: string;
}

export type CreateOrderData = Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
};

export type UpdateOrderData = Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  createdAt?: string;
};

export function getOrderTotal(order: Order): number {
  if (order.manualTotal !== undefined) return order.manualTotal;
  return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function getOrderCost(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
}

export function getOrderProfit(order: Order): number {
  return getOrderTotal(order) - getOrderCost(order);
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
};

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export function getOrderPaymentStatus(order: Order): PaymentStatus {
  const total = getOrderTotal(order);
  if (order.amountPaid <= 0) return 'unpaid';
  if (order.amountPaid >= total) return 'paid';
  return 'partial';
}

export function getOrderBalanceDue(order: Order): number {
  return Math.max(getOrderTotal(order) - order.amountPaid, 0);
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Pago',
  partial: 'Parcial',
  unpaid: 'Não pago',
};

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, 'success' | 'warning' | 'error'> = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'error',
};
