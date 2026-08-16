import {
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Order } from '@shared/types/order';
import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABELS,
  getOrderBalanceDue,
  getOrderPaymentStatus,
  getOrderTotal,
} from '@shared/types/order';
import { Modal } from '@/components/Modal';
import { StatusChip } from '@/components/StatusChip';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

interface OrderViewModalProps {
  viewTarget: Order | null;
  onClose: () => void;
  title?: string;
}

export function OrderViewModal({
  viewTarget,
  onClose,
  title = 'Detalhes do Pedido',
}: OrderViewModalProps) {
  return (
    <Modal
      open={!!viewTarget}
      onClose={onClose}
      title={title}
      maxWidth="600px"
      footer={
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
      }
    >
      {viewTarget && (
        <Stack spacing={2}>
          <Stack spacing={0.75}>
            <Typography variant="body2">
              <strong>Cliente:</strong> {viewTarget.customerName}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" component="span">
                <strong>Status:</strong>
              </Typography>
              <StatusChip
                label={ORDER_STATUS_LABELS[viewTarget.status]}
                color={ORDER_STATUS_COLOR[viewTarget.status]}
              />
            </Stack>
            <Typography variant="body2">
              <strong>Data:</strong> {formatDate(viewTarget.createdAt)}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" component="span">
                <strong>Pagamento:</strong>
              </Typography>
              <StatusChip
                label={PAYMENT_STATUS_LABELS[getOrderPaymentStatus(viewTarget)]}
                color={PAYMENT_STATUS_COLOR[getOrderPaymentStatus(viewTarget)]}
              />
            </Stack>
            {getOrderPaymentStatus(viewTarget) !== 'paid' && (
              <Typography variant="body2">
                <strong>Valor pago:</strong> {formatCurrency(viewTarget.amountPaid)} ·{' '}
                <strong>Saldo restante:</strong> {formatCurrency(getOrderBalanceDue(viewTarget))}
              </Typography>
            )}
          </Stack>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell>Qtd</TableCell>
                  <TableCell>Preço Unit.</TableCell>
                  <TableCell>Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewTarget.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle1" sx={{ textAlign: 'right' }}>
            {viewTarget.manualTotal !== undefined && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                (valor personalizado)
              </Typography>
            )}
            Total: {formatCurrency(getOrderTotal(viewTarget))}
          </Typography>
        </Stack>
      )}
    </Modal>
  );
}
