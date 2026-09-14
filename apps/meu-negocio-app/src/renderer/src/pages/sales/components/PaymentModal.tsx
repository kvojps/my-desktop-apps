import { useEffect, useState } from 'react';
import type { BaseSyntheticEvent } from 'react';
import type { Order } from '@shared/types/order';
import {
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABELS,
  getOrderPaymentStatus,
  getOrderTotal,
} from '@shared/types/order';
import { Button } from '@/components/Button';
import { Field, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { StatusChip } from '@/components/StatusChip';
import { PAYMENT_STATUS_ICON } from '@/components/StatusChip/statusIcons';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { formatCurrency } from '@/utils/format';
import { clampPaymentAmount } from '../utils/paymentAmount';

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
  const parsedAmount = clampPaymentAmount(amount, total);
  const balanceDue = Math.max(total - parsedAmount, 0);
  const status = getOrderPaymentStatus(order);

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
      maxWidth="440px"
      onSubmit={handleSave}
      footer={
        <>
          <Button onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} variant="primary">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </>
      }
    >
      <div className="negocio-form">
        <dl className="negocio-detail">
          <div>
            <dt>Cliente:</dt>
            <dd>{order.customerName}</dd>
          </div>
          <div>
            <dt>Total:</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
          <div>
            <dt>Status:</dt>
            <dd>
              <StatusChip
                label={PAYMENT_STATUS_LABELS[status]}
                color={PAYMENT_STATUS_COLOR[status]}
                icon={PAYMENT_STATUS_ICON[status]}
              />
            </dd>
          </div>
        </dl>

        {/* O campo é o acumulado, não uma parcela: quem já pagou R$ 100 e digita
            150 fica com R$ 150 pagos, e não com R$ 250. O rótulo precisa dizer
            isso, porque o nome antigo ("Valor pago") comportava as duas
            leituras e a errada custa dinheiro. */}
        <Field
          label="Total já pago"
          note={`Substitui o valor já registrado. Saldo restante: ${formatCurrency(balanceDue)}`}
        >
          <TextInput
            type="number"
            min="0"
            max={total}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>

        <div className="negocio-actions-row">
          <Button onClick={() => setAmount(String(total))}>Marcar como pago total</Button>
          <Button onClick={() => setAmount('0')}>Marcar como não pago</Button>
        </div>
      </div>
    </Modal>
  );
}
