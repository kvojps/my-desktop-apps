import { Button, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { BaseSyntheticEvent } from 'react';
import type { Order } from '@shared/types/order';
import {
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABELS,
  getOrderPaymentStatus,
  getOrderTotal,
} from '@shared/types/order';
import { Modal } from '@/components/Modal';
import { StatusChip } from '@/components/StatusChip';
import { PAYMENT_STATUS_ICON } from '@/components/StatusChip/statusIcons';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { formatCurrency } from '@/utils/format';

interface PaymentModalProps {
  order: Order | null;
  onClose: () => void;
  onSave: (id: string, amountPaid: number) => Promise<void>;
}

export function PaymentModal({ order, onClose, onSave }: PaymentModalProps) {
  const [amount, setAmount] = useState('0');
  const [isSaving, setIsSaving] = useState(false);
  const { showSnackbar, showError } = useSnackbar();

  useEffect(() => {
    if (order) setAmount(String(order.amountPaid));
  }, [order]);

  if (!order) return null;

  const total = getOrderTotal(order);
  const parsedAmount = Math.min(Math.max(Number(amount) || 0, 0), total);
  const balanceDue = Math.max(total - parsedAmount, 0);

  async function handleSave(event?: BaseSyntheticEvent) {
    event?.preventDefault();
    if (!order) return;
    setIsSaving(true);
    try {
      await onSave(order.id, parsedAmount);
      showSnackbar('Pagamento atualizado.');
      onClose();
    } catch (err) {
      showError(err, 'Erro ao registrar o pagamento.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar Pagamento"
      maxWidth="420px"
      onSubmit={handleSave}
      footer={
        <>
          <Button onClick={onClose} disabled={isSaving} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} variant="contained">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="body2">
            <strong>Cliente:</strong> {order.customerName}
          </Typography>
          <Typography variant="body2">
            <strong>Total:</strong> {formatCurrency(total)}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" component="span">
              <strong>Status:</strong>
            </Typography>
            <StatusChip
              label={PAYMENT_STATUS_LABELS[getOrderPaymentStatus(order)]}
              color={PAYMENT_STATUS_COLOR[getOrderPaymentStatus(order)]}
              icon={PAYMENT_STATUS_ICON[getOrderPaymentStatus(order)]}
            />
          </Stack>
        </Stack>

        <TextField
          label="Valor pago"
          type="number"
          slotProps={{ htmlInput: { min: 0, max: total, step: '0.01' } }}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
        />

        <Typography variant="body2" color="text.secondary">
          Saldo restante: {formatCurrency(balanceDue)}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button size="small" color="inherit" onClick={() => setAmount(String(total))}>
            Marcar como pago total
          </Button>
          <Button size="small" color="inherit" onClick={() => setAmount('0')}>
            Marcar como não pago
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
