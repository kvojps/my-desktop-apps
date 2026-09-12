import { Clock, StickyNote } from 'lucide-react';
import { Income } from '@shared/types/income';
import { ActionsMenu } from '@/components/ActionsMenu';
import { Button } from '@/components/Button';
import type { Column } from '@/components/DataTable';
import { StatusChip } from '@/components/StatusChip';
import { Tooltip } from '@/components/Tooltip';
import { formatDateOnly } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';
import { SettledChip } from './SettledChip';

/** O status da entrada, espelhando o da despesa sem o caso de vencida. */
function IncomeStatus({ income }: { income: Income }) {
  if (!income.isReceived) {
    return <StatusChip label="Pendente" color="warning" icon={<Clock aria-hidden="true" />} />;
  }

  return <SettledChip label="Recebida" verb="Recebido" date={income.receivedAt} />;
}

/** As colunas da aba de entradas, espelhando as de despesas. */
export function incomeColumns(): Column<Income>[] {
  return [
    {
      key: 'name',
      label: 'Entrada',
      sortable: true,
      render: (income) => (
        <span className="money-item-cell">
          <span className="money-item-name money-truncate" title={income.name}>
            {income.name}
          </span>
          {income.notes && (
            <Tooltip title="Possui observação">
              <StickyNote aria-hidden="true" />
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      key: 'account',
      label: 'Conta',
      render: (income) =>
        income.bankAccountName ? (
          <span className="money-truncate" title={income.bankAccountName}>
            {income.bankAccountName}
          </span>
        ) : (
          <span className="money-muted-text">—</span>
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
      render: (income) => (
        <span className="money-amount">{formatCurrencyOrFallback(income.amount, '—')}</span>
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
    <span className="money-row-actions">
      {income.isReceived ? (
        <Button onClick={() => actions.onUnreceive(income)} aria-label={`Desmarcar ${income.name}`}>
          Desmarcar
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={() => actions.onReceive(income)}
          aria-label={`Receber ${income.name}`}
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
    </span>
  );
}
