import { CheckCircle2, Clock, Paperclip } from 'lucide-react';
import { Expense } from '@shared/types/expense';
import { api } from '@/api/client';
import { Button } from '@/components/Button';
import { CategoryTag } from '@/components/CategoryTag';
import { Modal } from '@/components/Modal';
import { StatusChip } from '@/components/StatusChip';
import { formatDateOnly, formatPaidDate } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';
import { DetailField } from './DetailField';

interface ExpenseDetailDialogProps {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
}

export function ExpenseDetailDialog({ open, expense, onClose }: ExpenseDetailDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense?.name ?? 'Despesa'}
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      {expense && (
        <dl className="money-detail">
          <DetailField label="Valor">{formatCurrencyOrFallback(expense.amount)}</DetailField>
          {expense.categoryName && (
            <DetailField label="Categoria">
              <CategoryTag name={expense.categoryName} color={expense.categoryColor} />
            </DetailField>
          )}
          {expense.dueDate && (
            <DetailField label="Vencimento">{formatDateOnly(expense.dueDate)}</DetailField>
          )}
          <DetailField label="Status">
            {expense.isPaid ? (
              <StatusChip label="Paga" color="success" icon={<CheckCircle2 aria-hidden="true" />} />
            ) : (
              <StatusChip label="Pendente" color="warning" icon={<Clock aria-hidden="true" />} />
            )}
          </DetailField>
          {expense.paidAt && (
            <DetailField label="Pago em">{formatPaidDate(expense.paidAt)}</DetailField>
          )}
          {expense.bankAccountName && (
            <DetailField label="Conta">{expense.bankAccountName}</DetailField>
          )}
          {expense.receipt && (
            <DetailField label="Comprovante">
              {/* Abre no programa do sistema: o app não tem visualizador
                  próprio, e inventar um aqui seria recurso novo. */}
              <Button onClick={() => api.openReceipt(expense.receipt!)}>
                <Paperclip size={18} aria-hidden="true" />
                Abrir comprovante
              </Button>
            </DetailField>
          )}
          {expense.notes && (
            <DetailField label="Observação">
              <span className="money-detail-note">&quot;{expense.notes}&quot;</span>
            </DetailField>
          )}
        </dl>
      )}
    </Modal>
  );
}
