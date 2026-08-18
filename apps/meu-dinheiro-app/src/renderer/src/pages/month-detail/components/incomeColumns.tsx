import { CheckCircle, ScheduleOutlined, StickyNote2Outlined } from '@mui/icons-material';
import { Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import { Income } from '@shared/types/income';
import { ActionsMenu } from '@/components/ActionsMenu';
import type { Column } from '@/components/DataTable';
import { StatusChip } from '@/components/StatusChip';
import { formatDateOnly, formatPaidDate } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';

/**
 * O status da entrada. Depois de recebida, a data que importa é a do
 * recebimento — ela vai no tooltip do chip, porque a coluna de data tem
 * cabeçalho fixo e não pode trocar de significado por linha.
 */
function IncomeStatus({ income }: { income: Income }) {
  if (!income.isReceived) {
    return <StatusChip label="Pendente" color="warning" icon={<ScheduleOutlined />} />;
  }

  const chip = <StatusChip label="Recebida" color="success" icon={<CheckCircle />} />;
  if (!income.receivedAt) return chip;

  return (
    <Tooltip title={`Recebido em ${formatPaidDate(income.receivedAt)}`}>
      <Box component="span" sx={{ display: 'inline-flex' }}>
        {chip}
      </Box>
    </Tooltip>
  );
}

/** As colunas da aba de entradas, espelhando as de despesas. */
export function incomeColumns(): Column<Income>[] {
  return [
    {
      key: 'name',
      label: 'Entrada',
      sortable: true,
      render: (income) => (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap title={income.name} sx={{ fontWeight: 600 }}>
            {income.name}
          </Typography>
          {income.notes && (
            <Tooltip title="Possui observação">
              <StickyNote2Outlined
                fontSize="small"
                sx={{ color: 'text.secondary', flexShrink: 0 }}
              />
            </Tooltip>
          )}
        </Stack>
      ),
    },
    {
      key: 'account',
      label: 'Conta',
      render: (income) => (
        <Typography
          variant="body2"
          color={income.bankAccountName ? 'text.primary' : 'text.secondary'}
          noWrap
          title={income.bankAccountName ?? undefined}
        >
          {income.bankAccountName ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'expectedDate',
      label: 'Previsto',
      sortable: true,
      render: (income) => (income.expectedDate ? formatDateOnly(income.expectedDate) : '—'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (income) => <IncomeStatus income={income} />,
    },
    {
      key: 'amount',
      label: 'Valor',
      sortable: true,
      align: 'right',
      render: (income) => (
        <Box component="span" sx={{ fontWeight: 600 }}>
          {formatCurrencyOrFallback(income.amount, '—')}
        </Box>
      ),
    },
  ];
}

export interface IncomeActions {
  onReceive: (income: Income) => void;
  onUnreceive: (income: Income) => void;
  onViewDetail: (income: Income) => void;
  onEdit: (income: Income) => void;
  onDelete: (income: Income) => void;
}

/** A ação principal da linha mais o menu de três pontos. */
export function renderIncomeActions(income: Income, actions: IncomeActions) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
      {income.isReceived ? (
        <Button size="small" onClick={() => actions.onUnreceive(income)}>
          Desmarcar
        </Button>
      ) : (
        <Button
          size="small"
          variant="contained"
          color="success"
          onClick={() => actions.onReceive(income)}
        >
          Receber
        </Button>
      )}
      <ActionsMenu
        ariaLabel={`Mais ações para ${income.name}`}
        onView={() => actions.onViewDetail(income)}
        onEdit={() => actions.onEdit(income)}
        onDelete={() => actions.onDelete(income)}
      />
    </Stack>
  );
}
