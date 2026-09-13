import { BankAccount } from '@shared/types/bank-account';
import { Category } from '@shared/types/category';
import { DefaultExpense } from '@shared/types/expense';
import { DefaultIncome } from '@shared/types/income';
import { ActionsMenu } from '@/components/ActionsMenu';
import { CategoryTag } from '@/components/CategoryTag';
import type { Column } from '@/components/DataTable';
import { formatCurrency, formatCurrencyOrFallback } from '@/utils/format';

/**
 * As colunas das quatro listas de cadastro. Um arquivo só, e não quatro no
 * molde de `expenseColumns.tsx`: aqui cada conjunto tem no máximo quatro
 * colunas curtas. Se algum crescer, separa.
 */

/**
 * O nome do registro, que é sempre a primeira coluna e o que identifica a
 * linha. O `money-item-cell` em volta não é enfeite: `max-width` não alcança
 * caixa inline, e sem ele o teto de reticência do nome não existe.
 */
function NameCell({ name }: { name: string }) {
  return (
    <span className="money-item-cell">
      <span className="money-item-name money-truncate" title={name}>
        {name}
      </span>
    </span>
  );
}

/** "dia 5" ou travessão. Nem toda despesa padrão tem vencimento fixo. */
function dayLabel(day: number | null) {
  return day ? `dia ${day}` : '—';
}

export interface RowActions<T> {
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}

/**
 * Editar e excluir no menu de três pontos, como em toda linha de tabela do app.
 * O `ariaLabel` diz de qual item são as ações — sem ele a tela teria N botões
 * chamados "Ações" (§5.5).
 */
export function renderRowActions<T extends { name: string }>(
  item: T,
  deleteLabel: string,
  actions: RowActions<T>,
) {
  return (
    <ActionsMenu
      ariaLabel={`Mais ações para ${item.name}`}
      deleteLabel={deleteLabel}
      onEdit={() => actions.onEdit(item)}
      onDelete={() => actions.onDelete(item)}
    />
  );
}

export const bankAccountColumns: Column<BankAccount>[] = [
  {
    key: 'name',
    label: 'Conta',
    render: (account) => <NameCell name={account.name} />,
  },
  {
    key: 'balance',
    label: 'Saldo',
    // Só o negativo é pintado, como a coluna de Realizado da Visão Geral:
    // saldo positivo é o estado normal, não um aviso (§1.5).
    render: (account) => (
      <span
        className="money-amount money-tone"
        data-tone={account.balance < 0 ? 'alert' : 'neutral'}
      >
        {formatCurrency(account.balance)}
      </span>
    ),
  },
];

export const categoryColumns: Column<Category>[] = [
  {
    key: 'name',
    label: 'Categoria',
    // A categoria aparece como ponto colorido + nome em todo o resto do app;
    // aqui, onde ela é cadastrada, não seria diferente.
    render: (category) => <CategoryTag name={category.name} color={category.color} />,
  },
];

export const defaultExpenseColumns: Column<DefaultExpense>[] = [
  {
    key: 'name',
    label: 'Despesa',
    render: (expense) => <NameCell name={expense.name} />,
  },
  {
    key: 'category',
    label: 'Categoria',
    render: (expense) => <CategoryTag name={expense.categoryName} color={expense.categoryColor} />,
  },
  {
    key: 'dueDay',
    label: 'Vencimento',
    render: (expense) => dayLabel(expense.dueDay),
  },
  {
    key: 'amount',
    label: 'Valor',
    render: (expense) => (
      <span className="money-amount">{formatCurrencyOrFallback(expense.amount, 'Variável')}</span>
    ),
  },
];

export const defaultIncomeColumns: Column<DefaultIncome>[] = [
  {
    key: 'name',
    label: 'Entrada',
    render: (income) => <NameCell name={income.name} />,
  },
  {
    key: 'bankAccount',
    label: 'Conta',
    render: (income) =>
      income.bankAccountName ? (
        <span className="money-item-cell">
          <span className="money-truncate" title={income.bankAccountName}>
            {income.bankAccountName}
          </span>
        </span>
      ) : (
        <span className="money-muted-text">—</span>
      ),
  },
  {
    key: 'expectedDay',
    label: 'Previsto',
    render: (income) => dayLabel(income.expectedDay),
  },
  {
    key: 'amount',
    label: 'Valor',
    render: (income) => (
      <span className="money-amount">{formatCurrencyOrFallback(income.amount, 'Variável')}</span>
    ),
  },
];
