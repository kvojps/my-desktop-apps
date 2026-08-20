import {
  Block,
  CheckCircle,
  HourglassEmpty,
  LocalShipping,
  MoneyOff,
  Paid,
  Timelapse,
} from '@mui/icons-material';
import type { ReactElement } from 'react';
import type { OrderStatus, PaymentStatus } from '@shared/types/order';

/**
 * O segundo canal dos chips de estado. Vive aqui, e não em `@shared/types`,
 * porque `shared/` é o contrato entre main e renderer e não importa React.
 *
 * O ícone acompanha um rótulo dentro do chip, então segue preenchido — a regra
 * de ícone `Outlined` vale para o ícone que **identifica** sozinho (§3).
 */
const SIZE = 14;

export const ORDER_STATUS_ICON: Record<OrderStatus, ReactElement> = {
  pending: <HourglassEmpty sx={{ fontSize: SIZE }} />,
  in_progress: <LocalShipping sx={{ fontSize: SIZE }} />,
  completed: <CheckCircle sx={{ fontSize: SIZE }} />,
  cancelled: <Block sx={{ fontSize: SIZE }} />,
};

export const PAYMENT_STATUS_ICON: Record<PaymentStatus, ReactElement> = {
  paid: <Paid sx={{ fontSize: SIZE }} />,
  partial: <Timelapse sx={{ fontSize: SIZE }} />,
  unpaid: <MoneyOff sx={{ fontSize: SIZE }} />,
};
