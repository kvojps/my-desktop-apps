import {
  AttachFile,
  CheckCircle,
  ReportProblemOutlined,
  ScheduleOutlined,
  StickyNote2Outlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import { Expense } from '@shared/types/expense';
import { ActionsMenu } from '@/components/ActionsMenu';
import { CategoryTag } from '@/components/CategoryTag';
import type { Column } from '@/components/DataTable';
import { StatusChip } from '@/components/StatusChip';
import { formatDateOnly, formatPaidDate } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';

export function isExpenseOverdue(expense: Expense, today: string) {
  return !expense.isPaid && !!expense.dueDate && expense.dueDate < today;
}

/**
 * O status da despesa como `StatusChip`. O chip é preenchido, que é a única
 * coisa que o âmbar pode fazer (§1.4), e o ícone repete o que a cor diz.
 *
 * A data do pagamento vai no tooltip, e não em coluna própria: um cabeçalho de
 * tabela é fixo, e "Vencimento" e "Pago em" não podem ser a mesma coluna. É o
 * mesmo recurso que a Visão Geral usa para o valor em atraso.
 */
function ExpenseStatus({ expense, today }: { expense: Expense; today: string }) {
  if (expense.isPaid) {
    const chip = <StatusChip label="Paga" color="success" icon={<CheckCircle />} />;
    if (!expense.paidAt) return chip;
    return (
      <Tooltip title={`Pago em ${formatPaidDate(expense.paidAt)}`}>
        <Box component="span" sx={{ display: 'inline-flex' }}>
          {chip}
        </Box>
      </Tooltip>
    );
  }

  if (isExpenseOverdue(expense, today)) {
    return <StatusChip label="Vencida" color="error" icon={<ReportProblemOutlined />} />;
  }

  return <StatusChip label="Pendente" color="warning" icon={<ScheduleOutlined />} />;
}

/**
 * As colunas da aba de despesas. A chave de cada coluna ordenável é a mesma
 * chave de ordenação do `useItemsFilter`, então o cabeçalho ordena sem tradução
 * no meio.
 */
export function expenseColumns(today: string): Column<Expense>[] {
  return [
    {
      key: 'name',
      label: 'Despesa',
      sortable: true,
      render: (expense) => (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap title={expense.name} sx={{ fontWeight: 600 }}>
            {expense.name}
          </Typography>
          {expense.notes && (
            <Tooltip title="Possui observação">
              <StickyNote2Outlined
                fontSize="small"
                sx={{ color: 'text.secondary', flexShrink: 0 }}
              />
            </Tooltip>
          )}
          {expense.receipt && (
            <Tooltip title="Possui comprovante">
              <AttachFile fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
            </Tooltip>
          )}
        </Stack>
      ),
    },
    {
      key: 'category',
      label: 'Categoria',
      render: (expense) => (
        <CategoryTag name={expense.categoryName} color={expense.categoryColor} />
      ),
    },
    {
      key: 'dueDate',
      label: 'Vencimento',
      sortable: true,
      // Só o vencido é pintado. Toda data em dia de vermelho saturaria a coluna
      // e a cor deixaria de sinalizar condição (§1.5).
      render: (expense) => {
        const overdue = isExpenseOverdue(expense, today);
        return (
          <Box
            component="span"
            sx={{ color: overdue ? 'error.main' : 'text.primary', fontWeight: overdue ? 600 : 400 }}
          >
            {expense.dueDate ? formatDateOnly(expense.dueDate) : '—'}
          </Box>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (expense) => <ExpenseStatus expense={expense} today={today} />,
    },
    {
      key: 'amount',
      label: 'Valor',
      sortable: true,
      render: (expense) => (
        <Box component="span" sx={{ fontWeight: 600 }}>
          {formatCurrencyOrFallback(expense.amount, '—')}
        </Box>
      ),
    },
  ];
}

export interface ExpenseActions {
  onPay: (expense: Expense) => void;
  onUnpay: (expense: Expense) => void;
  onViewDetail: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

/** A ação principal da linha mais o menu de três pontos. */
export function renderExpenseActions(expense: Expense, actions: ExpenseActions) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
      {expense.isPaid ? (
        // "Desmarcar" era `color="warning"` — âmbar sobre papel dá 1.83:1 como
        // rótulo de botão. Ele fica no primário.
        <Button size="small" onClick={() => actions.onUnpay(expense)}>
          Desmarcar
        </Button>
      ) : (
        <Button size="small" variant="contained" onClick={() => actions.onPay(expense)}>
          Pagar
        </Button>
      )}
      <ActionsMenu
        ariaLabel={`Mais ações para ${expense.name}`}
        onView={() => actions.onViewDetail(expense)}
        onEdit={() => actions.onEdit(expense)}
        onDelete={() => actions.onDelete(expense)}
      />
    </Stack>
  );
}
