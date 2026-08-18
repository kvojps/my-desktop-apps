import { Box, Typography } from '@mui/material';
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

/** O nome do registro, que é sempre a primeira coluna e o que identifica a linha. */
function NameCell({ name }: { name: string }) {
  return (
    <Typography variant="body2" noWrap title={name} sx={{ fontWeight: 600 }}>
      {name}
    </Typography>
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
    align: 'right',
    // Só o negativo é pintado, como a coluna de Realizado da Visão Geral:
    // saldo positivo é o estado normal, não um aviso (§1.5).
    render: (account) => (
      <Box
        component="span"
        sx={{ fontWeight: 600, color: account.balance < 0 ? 'error.main' : 'text.primary' }}
      >
        {formatCurrency(account.balance)}
      </Box>
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
    align: 'right',
    render: (expense) => (
      <Box component="span" sx={{ fontWeight: 600 }}>
        {formatCurrencyOrFallback(expense.amount, 'Variável')}
      </Box>
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
    render: (income) => (
      <Typography variant="body2" noWrap title={income.bankAccountName ?? undefined}>
        {income.bankAccountName ?? '—'}
      </Typography>
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
    align: 'right',
    render: (income) => (
      <Box component="span" sx={{ fontWeight: 600 }}>
        {formatCurrencyOrFallback(income.amount, 'Variável')}
      </Box>
    ),
  },
];
