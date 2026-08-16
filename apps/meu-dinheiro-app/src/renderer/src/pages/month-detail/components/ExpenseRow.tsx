import { CheckCircle, ReportProblemOutlined, ScheduleOutlined } from '@mui/icons-material';
import { Expense } from '@shared/types/expense';
import { CategoryTag } from '@/components/CategoryTag';
import { formatDateOnly, todayDateString } from '@/utils/date';
import { ItemRow, ItemRowAction, ItemRowStatus } from './ItemRow';

interface ExpenseRowProps {
  expense: Expense;
  onPay: () => void;
  onUnpay: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** A mesma despesa do `ExpenseCard`, na visualização em lista densa. */
export function ExpenseRow({
  expense,
  onPay,
  onUnpay,
  onViewDetail,
  onEdit,
  onDelete,
}: ExpenseRowProps) {
  const isOverdue = !expense.isPaid && !!expense.dueDate && expense.dueDate < todayDateString();

  let status: ItemRowStatus = {
    color: 'warning',
    label: 'Pendente',
    icon: <ScheduleOutlined fontSize="small" />,
  };
  if (expense.isPaid) {
    status = { color: 'success', label: 'Paga', icon: <CheckCircle fontSize="small" /> };
  } else if (isOverdue) {
    status = { color: 'error', label: 'Vencida', icon: <ReportProblemOutlined fontSize="small" /> };
  }

  const action: ItemRowAction = expense.isPaid
    ? { label: 'Desmarcar', onClick: onUnpay, variant: 'text', color: 'warning' }
    : { label: 'Pagar', onClick: onPay, variant: 'contained', color: 'primary' };

  return (
    <ItemRow
      name={expense.name}
      hasNotes={!!expense.notes}
      hasReceipt={!!expense.receipt}
      status={status}
      secondary={<CategoryTag name={expense.categoryName} color={expense.categoryColor} />}
      metaLabel="Vencimento"
      metaValue={expense.dueDate ? formatDateOnly(expense.dueDate) : '—'}
      metaHighlight={isOverdue}
      amount={expense.amount}
      action={action}
      onViewDetail={onViewDetail}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
