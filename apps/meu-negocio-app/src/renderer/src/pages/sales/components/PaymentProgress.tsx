import { LinearProgress, Stack, Typography } from '@mui/material';
import type { Order } from '@shared/types/order';
import {
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABELS,
  getOrderBalanceDue,
  getOrderPaymentStatus,
  getOrderTotal,
} from '@shared/types/order';
import { StatusChip } from '@/components/StatusChip';
import { formatCurrency } from '@/utils/format';

const BAR_WIDTH = 110;

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
    // alignItems evita que o Stack em coluna estique o chip até a largura da
    // barra — um chip de largura total deixa de parecer um chip.
    <Stack spacing={0.5} alignItems="flex-start" sx={{ minWidth: BAR_WIDTH }}>
      <StatusChip label={PAYMENT_STATUS_LABELS[status]} color={PAYMENT_STATUS_COLOR[status]} />
      <LinearProgress
        variant="determinate"
        value={paidPct}
        color={PAYMENT_STATUS_COLOR[status]}
        aria-label={`${Math.round(paidPct)}% pago`}
        sx={{ width: BAR_WIDTH, height: 4, borderRadius: 2 }}
      />
      {balanceDue > 0 && (
        <Typography variant="caption" color="text.secondary">
          faltam {formatCurrency(balanceDue)}
        </Typography>
      )}
    </Stack>
  );
}
