import type { Order } from '@shared/types/order';
import {
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABELS,
  getOrderBalanceDue,
  getOrderPaymentStatus,
  getOrderTotal,
} from '@shared/types/order';
import { StatusChip } from '@/components/StatusChip';
import { PAYMENT_STATUS_ICON } from '@/components/StatusChip/statusIcons';
import { formatCurrency } from '@/utils/format';

/**
 * O chip sozinho dizia apenas "Parcial" — mesmo rótulo para quem pagou 10% e
 * para quem pagou 90%. A barra transforma a coluna inteira em algo que se lê de
 * relance, e o valor que falta é a informação sobre a qual se age.
 */
export function PaymentProgress({ order }: { order: Order }) {
  const status = getOrderPaymentStatus(order);
  const total = getOrderTotal(order);
  const balanceDue = getOrderBalanceDue(order);
  const paidPct = total > 0 ? Math.min(100, (order.amountPaid / total) * 100) : 0;

  return (
    // O medidor vai por último, depois do rótulo e do valor que falta, e tem
    // largura fixa: é ela que faz todas as barras da coluna começarem e
    // terminarem no mesmo ponto, a partir da borda esquerda (§2.1).
    <div className="negocio-cell-stack negocio-payment">
      <StatusChip
        label={PAYMENT_STATUS_LABELS[status]}
        color={PAYMENT_STATUS_COLOR[status]}
        icon={PAYMENT_STATUS_ICON[status]}
      />
      {balanceDue > 0 && (
        <span className="negocio-caption">faltam {formatCurrency(balanceDue)}</span>
      )}
      <span
        className="negocio-meter"
        data-color={PAYMENT_STATUS_COLOR[status]}
        role="progressbar"
        aria-label={`${Math.round(paidPct)}% pago`}
        aria-valuenow={Math.round(paidPct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${paidPct}%` }} />
      </span>
    </div>
  );
}
