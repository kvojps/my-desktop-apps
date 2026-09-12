import { Clock, Paperclip, StickyNote, TriangleAlert } from 'lucide-react';
import { Expense } from '@shared/types/expense';
import { ActionsMenu } from '@/components/ActionsMenu';
import { Button } from '@/components/Button';
import { CategoryTag } from '@/components/CategoryTag';
import type { Column } from '@/components/DataTable';
import { StatusChip } from '@/components/StatusChip';
import { Tooltip } from '@/components/Tooltip';
import { formatDateOnly } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';
import { SettledChip } from './SettledChip';

export function isExpenseOverdue(expense: Expense, today: string) {
  return !expense.isPaid && !!expense.dueDate && expense.dueDate < today;
}

/**
 * O status da despesa como `StatusChip`. O chip é preenchido, que é a única
 * coisa que o âmbar pode fazer (§1.4), e o ícone repete o que a cor diz.
 */
function ExpenseStatus({ expense, today }: { expense: Expense; today: string }) {
  if (expense.isPaid) {
    return <SettledChip label="Paga" verb="Pago" date={expense.paidAt} />;
  }

  if (isExpenseOverdue(expense, today)) {
    return <StatusChip label="Vencida" color="error" icon={<TriangleAlert aria-hidden="true" />} />;
  }

  return <StatusChip label="Pendente" color="warning" icon={<Clock aria-hidden="true" />} />;
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
        <span className="money-item-cell">
          <span className="money-item-name money-truncate" title={expense.name}>
            {expense.name}
          </span>
          {expense.notes && (
            <Tooltip title="Possui observação">
              <StickyNote aria-hidden="true" />
            </Tooltip>
          )}
          {expense.receipt && (
            <Tooltip title="Possui comprovante">
              <Paperclip aria-hidden="true" />
            </Tooltip>
          )}
        </span>
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
          <span
            className={overdue ? 'money-amount money-tone' : 'money-tone'}
            data-tone={overdue ? 'alert' : 'neutral'}
          >
            {expense.dueDate ? formatDateOnly(expense.dueDate) : '—'}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (expense) => (
        <span className="money-status-cell">
          <ExpenseStatus expense={expense} today={today} />
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Valor',
      sortable: true,
      render: (expense) => (
        <span className="money-amount">{formatCurrencyOrFallback(expense.amount, '—')}</span>
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
    <span className="money-row-actions">
      {expense.isPaid ? (
        <Button
          className="money-action-primary"
          onClick={() => actions.onUnpay(expense)}
          aria-label={`Desmarcar ${expense.name}`}
        >
          Desmarcar
        </Button>
      ) : (
        <Button
          className="money-action-primary"
          variant="primary"
          onClick={() => actions.onPay(expense)}
          aria-label={`Pagar ${expense.name}`}
        >
          Pagar
        </Button>
      )}
      <ActionsMenu
        ariaLabel={`Mais ações para ${expense.name}`}
        onView={() => actions.onViewDetail(expense)}
        onEdit={() => actions.onEdit(expense)}
        onDelete={() => actions.onDelete(expense)}
      />
    </span>
  );
}
