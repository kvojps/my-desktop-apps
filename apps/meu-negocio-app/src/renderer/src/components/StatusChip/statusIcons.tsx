import { Ban, BanknoteCheck, BanknoteX, CircleCheck, Hourglass, Timer, Truck } from 'lucide-react';
import type { ReactElement } from 'react';
import type { OrderStatus, PaymentStatus } from '@shared/types/order';

/**
 * O segundo canal dos chips de estado. Vive aqui, e não em `@shared/types`,
 * porque `shared/` é o contrato entre main e renderer e não importa React.
 *
 * O tamanho é do CSS do chip (`.negocio-chip svg`), para nenhum ícone de estado
 * poder sair do registro dos outros.
 */
export const ORDER_STATUS_ICON: Record<OrderStatus, ReactElement> = {
  pending: <Hourglass aria-hidden="true" />,
  in_progress: <Truck aria-hidden="true" />,
  completed: <CircleCheck aria-hidden="true" />,
  cancelled: <Ban aria-hidden="true" />,
};

export const PAYMENT_STATUS_ICON: Record<PaymentStatus, ReactElement> = {
  paid: <BanknoteCheck aria-hidden="true" />,
  partial: <Timer aria-hidden="true" />,
  unpaid: <BanknoteX aria-hidden="true" />,
};
