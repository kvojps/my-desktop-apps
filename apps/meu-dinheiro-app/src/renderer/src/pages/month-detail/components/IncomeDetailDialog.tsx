import { CheckCircle2, Clock } from 'lucide-react';
import { Income } from '@shared/types/income';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { StatusChip } from '@/components/StatusChip';
import { formatDateOnly, formatPaidDate } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';
import { DetailField } from './DetailField';

interface IncomeDetailDialogProps {
  open: boolean;
  income: Income | null;
  onClose: () => void;
}

export function IncomeDetailDialog({ open, income, onClose }: IncomeDetailDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={income?.name ?? 'Entrada'}
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      {income && (
        <dl className="money-detail">
          <DetailField label="Valor">{formatCurrencyOrFallback(income.amount)}</DetailField>
          {income.expectedDate && (
            <DetailField label="Previsto">{formatDateOnly(income.expectedDate)}</DetailField>
          )}
          <DetailField label="Status">
            {income.isReceived ? (
              <StatusChip
                label="Recebida"
                color="success"
                icon={<CheckCircle2 aria-hidden="true" />}
              />
            ) : (
              <StatusChip label="Pendente" color="warning" icon={<Clock aria-hidden="true" />} />
            )}
          </DetailField>
          {income.receivedAt && (
            <DetailField label="Recebido em">{formatPaidDate(income.receivedAt)}</DetailField>
          )}
          {income.bankAccountName && (
            <DetailField label={income.isReceived ? 'Conta' : 'Conta prevista'}>
              {income.bankAccountName}
            </DetailField>
          )}
          {income.notes && (
            <DetailField label="Observação">
              <span className="money-detail-note">&quot;{income.notes}&quot;</span>
            </DetailField>
          )}
        </dl>
      )}
    </Modal>
  );
}
