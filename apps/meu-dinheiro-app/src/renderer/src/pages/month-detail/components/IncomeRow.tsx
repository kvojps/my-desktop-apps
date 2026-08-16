import { CheckCircle, ScheduleOutlined } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { Income } from '@shared/types/income';
import { formatDateOnly, formatPaidDate } from '@/utils/date';
import { ItemRow, ItemRowAction, ItemRowStatus } from './ItemRow';

interface IncomeRowProps {
  income: Income;
  onReceive: () => void;
  onUnreceive: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** A mesma entrada do `IncomeCard`, na visualização em lista densa. */
export function IncomeRow({
  income,
  onReceive,
  onUnreceive,
  onViewDetail,
  onEdit,
  onDelete,
}: IncomeRowProps) {
  const status: ItemRowStatus = income.isReceived
    ? { color: 'success', label: 'Recebida', icon: <CheckCircle fontSize="small" /> }
    : { color: 'warning', label: 'Pendente', icon: <ScheduleOutlined fontSize="small" /> };

  const action: ItemRowAction = income.isReceived
    ? { label: 'Desmarcar', onClick: onUnreceive, variant: 'text', color: 'warning' }
    : { label: 'Receber', onClick: onReceive, variant: 'contained', color: 'success' };

  // Depois de recebida, a data que importa é a do recebimento, não a previsão.
  const showReceived = income.isReceived && !!income.receivedAt;

  return (
    <ItemRow
      name={income.name}
      hasNotes={!!income.notes}
      status={status}
      secondary={
        <Typography
          variant="body2"
          color={income.bankAccountName ? 'text.primary' : 'text.secondary'}
          noWrap
          title={income.bankAccountName ?? undefined}
        >
          {income.bankAccountName ?? '—'}
        </Typography>
      }
      metaLabel={showReceived ? 'Recebido em' : 'Previsto'}
      metaValue={
        showReceived
          ? formatPaidDate(income.receivedAt!)
          : income.expectedDate
            ? formatDateOnly(income.expectedDate)
            : '—'
      }
      amount={income.amount}
      action={action}
      onViewDetail={onViewDetail}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
