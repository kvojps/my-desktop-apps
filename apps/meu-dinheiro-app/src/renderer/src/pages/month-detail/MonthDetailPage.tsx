import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Plus,
  Receipt,
  SearchX,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Expense } from '@shared/types/expense';
import { Income } from '@shared/types/income';
import { ActionsMenu } from '@/components/ActionsMenu';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Field, SelectInput } from '@/components/Field';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import { Tabs } from '@/components/Tabs';
import { useNavigationMemory } from '@/contexts/NavigationContext';
import { useBankAccounts } from '@/hooks/bank-accounts/useBankAccounts';
import { useCategories } from '@/hooks/categories/useCategories';
import { useMonth } from '@/hooks/months/useMonth';
import {
  BALANCE_LABELS,
  computeMonthBalance,
  pendingSubtitle,
} from '@/hooks/months/useMonthBalance';
import { useItemsFilter } from '@/hooks/useItemsFilter';
import { monthDetailPath, originPath } from '@/routes';
import { todayDateString } from '@/utils/date';
import { formatCurrency } from '@/utils/format';
import { useItemActions } from './hooks/useItemActions';
import { AddExpenseDialog } from './components/AddExpenseDialog';
import { AddIncomeDialog } from './components/AddIncomeDialog';
import { EditExpenseDialog } from './components/EditExpenseDialog';
import { EditIncomeDialog } from './components/EditIncomeDialog';
import { ExpenseDetailDialog } from './components/ExpenseDetailDialog';
import { IncomeDetailDialog } from './components/IncomeDetailDialog';
import { ItemActionDialogs } from './components/ItemActionDialogs';
import { ItemsTab } from './components/ItemsTab';
import { PayDialog } from './components/PayDialog';
import { ReceiveDialog } from './components/ReceiveDialog';
import {
  expenseColumns,
  isExpenseOverdue,
  renderExpenseActions,
} from './components/expenseColumns';
import { incomeColumns, renderIncomeActions } from './components/incomeColumns';

type ExpenseStatus = 'all' | 'pending' | 'paid' | 'overdue';
type IncomeStatus = 'all' | 'pending' | 'received';
type ExpenseSort = 'dueDate' | 'name' | 'amount';
type IncomeSort = 'expectedDate' | 'name' | 'amount';

const EXPENSE_STATUS_OPTIONS: { value: ExpenseStatus; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'paid', label: 'Pagas' },
  { value: 'overdue', label: 'Vencidas' },
];

const INCOME_STATUS_OPTIONS: { value: IncomeStatus; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'received', label: 'Recebidas' },
];

/** Datas ausentes vão para o fim da ordenação por data. */
const NO_DATE = '9999-99-99';

export function MonthDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { origin } = useNavigationMemory();
  const {
    month,
    loading,
    notFound,
    error,
    prevMonthId,
    nextMonthId,
    deleting,
    retry,
    pay,
    unpay,
    addExpense,
    editExpense,
    deleteExpense,
    receive,
    unreceive,
    addIncome,
    editIncome,
    deleteIncome,
    deleteMonth,
  } = useMonth(id);
  const { bankAccounts } = useBankAccounts();
  const { categories } = useCategories();

  const [tab, setTab] = useState<'expenses' | 'incomes'>('expenses');
  const [deleteMonthOpen, setDeleteMonthOpen] = useState(false);

  const today = todayDateString();

  // O Mês pertence à tela que o abriu: voltar é voltar para ela, com a consulta
  // que ela tinha. Sem origem — uma rota aberta direto — o retorno é a Visão
  // Geral, e andar de Mês em Mês não troca nem uma coisa nem outra.
  const backPath = originPath(origin);
  const backLabel = origin === 'history' ? 'Voltar para o Histórico' : 'Voltar para a Visão Geral';

  const expenseActions = useItemActions<Expense>({ remove: deleteExpense, undo: unpay });
  const incomeActions = useItemActions<Income>({ remove: deleteIncome, undo: unreceive });

  const expenseFilter = useItemsFilter<Expense, ExpenseStatus, ExpenseSort>({
    items: month?.expenses ?? [],
    defaultStatus: 'all',
    defaultSort: 'dueDate',
    searchText: (expense) => expense.name,
    matchesStatus: (expense, status) => {
      if (status === 'all') return true;
      if (status === 'paid') return expense.isPaid;
      if (status === 'overdue') return isExpenseOverdue(expense, today);
      return !expense.isPaid;
    },
    matchesExtra: (expense, categoryId) => String(expense.categoryId ?? '') === categoryId,
    compare: (a, b, sort) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'pt-BR');
      if (sort === 'amount') return (a.amount ?? 0) - (b.amount ?? 0);
      return (a.dueDate || NO_DATE).localeCompare(b.dueDate || NO_DATE);
    },
  });

  const incomeFilter = useItemsFilter<Income, IncomeStatus, IncomeSort>({
    items: month?.incomes ?? [],
    defaultStatus: 'all',
    defaultSort: 'expectedDate',
    searchText: (income) => income.name,
    matchesStatus: (income, status) => {
      if (status === 'all') return true;
      if (status === 'received') return income.isReceived;
      return !income.isReceived;
    },
    compare: (a, b, sort) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'pt-BR');
      if (sort === 'amount') return (a.amount ?? 0) - (b.amount ?? 0);
      return (a.expectedDate || NO_DATE).localeCompare(b.expectedDate || NO_DATE);
    },
  });

  async function handleDeleteMonth() {
    if (await deleteMonth()) {
      setDeleteMonthOpen(false);
      navigate(backPath);
    }
  }

  if (loading) {
    return (
      /* Espelha o layout real: cabeçalho, os três indicadores, a fileira de
         abas, a barra de filtros e a tabela — para o conteúdo não saltar
         quando os dados chegam (§5.3). */
      <div className="money-page">
        <Skeleton variant="text" width={240} height={48} />
        <StatCardGrid count={3}>
          {Array.from({ length: 3 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </StatCardGrid>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={420} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Não foi possível carregar o mês" error={error} onRetry={retry} />;
  }

  if (notFound || !month) {
    // Não é erro nem lista vazia: o Mês existia e não existe mais (§5.4). A
    // saída é voltar — e o destino é a tela de onde ele foi aberto, que
    // continua lá mesmo quando ele não está.
    return (
      <EmptyState
        icon={<SearchX size={48} aria-hidden="true" />}
        title="Mês não encontrado"
        description="O mês que você tentou abrir não existe mais."
        action={
          <Button variant="primary" onClick={() => navigate(backPath)}>
            <ArrowLeft size={18} aria-hidden="true" />
            {backLabel}
          </Button>
        }
      />
    );
  }

  const paidCount = month.expenses.filter((e) => e.isPaid).length;
  const receivedCount = month.incomes.filter((i) => i.isReceived).length;
  const balance = computeMonthBalance(month);

  const settlingExpense = expenseActions.settling;
  const editingExpense = expenseActions.editing;
  const settlingIncome = incomeActions.settling;
  const editingIncome = incomeActions.editing;

  return (
    <div className="money-page">
      <PageHeader
        icon={<CalendarDays size={22} aria-hidden="true" />}
        title={month.label}
        subtitle={`${paidCount}/${month.expenses.length} despesas pagas · ${receivedCount}/${month.incomes.length} entradas recebidas`}
        actions={
          <div className="money-row-actions">
            <Button
              variant="ghost"
              aria-label={backLabel}
              title={backLabel}
              onClick={() => navigate(backPath)}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              aria-label="Mês anterior"
              title="Mês anterior"
              disabled={!prevMonthId}
              onClick={() => prevMonthId && navigate(monthDetailPath(prevMonthId))}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              aria-label="Próximo mês"
              title="Próximo mês"
              disabled={!nextMonthId}
              onClick={() => nextMonthId && navigate(monthDetailPath(nextMonthId))}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </Button>
            <ActionsMenu
              ariaLabel="Mais ações do mês"
              deleteLabel="Excluir mês"
              onDelete={() => setDeleteMonthOpen(true)}
            />
          </div>
        }
      />

      {/* Os mesmos três indicadores da Visão Geral, recortados no mês. Antes
          eram um bloco só, com o Realizado grande e as quatro parcelas
          (Recebido / A receber / Pago / A pagar) embaixo: seis números na tela
          para quatro independentes, já que recebido é entradas menos a receber.
          Aqui cada card traz um total como valor e o que ainda não aconteceu
          como legenda.

          Sem `forecast` nem `spark`: a previsão do `useYearForecast` é do ano
          corrente, e pendurá-la num mês isolado seria pôr dois recortes de
          tempo no mesmo card sem dizer que são dois. */}
      <StatCardGrid count={3}>
        <StatCard
          label={`${BALANCE_LABELS.realized} no mês`}
          value={formatCurrency(balance.realized)}
          sub={`${BALANCE_LABELS.projected}: ${formatCurrency(balance.projected)}`}
          icon={PiggyBank}
          accent="info"
          tone={balance.realized >= 0 ? 'positive' : 'alert'}
        />
        <StatCard
          label="Entradas no mês"
          value={formatCurrency(balance.totalIncome)}
          sub={pendingSubtitle(
            balance.totalIncome,
            balance.pendingIncome,
            'a receber',
            'tudo recebido',
          )}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          label="Despesas no mês"
          value={formatCurrency(balance.totalExpense)}
          sub={pendingSubtitle(
            balance.totalExpense,
            balance.pendingExpense,
            'a pagar',
            'tudo pago',
          )}
          icon={TrendingDown}
          accent="secondary"
        />
      </StatCardGrid>

      {/* A ação mais frequente da tela fica ao lado das abas e sempre visível —
          antes ela era um botão discreto no rodapé da lista. */}
      <Tabs
        label="Itens do mês"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'expenses', label: `Despesas (${paidCount}/${month.expenses.length})` },
          { value: 'incomes', label: `Entradas (${receivedCount}/${month.incomes.length})` },
        ]}
        actions={
          <Button
            variant="primary"
            onClick={tab === 'expenses' ? expenseActions.openAdd : incomeActions.openAdd}
          >
            <Plus size={18} aria-hidden="true" />
            {tab === 'expenses' ? 'Adicionar Despesa' : 'Adicionar Entrada'}
          </Button>
        }
      >
        {tab === 'expenses' ? (
          <ItemsTab
            filter={expenseFilter}
            totalCount={month.expenses.length}
            columns={expenseColumns(today)}
            searchLabel="despesa"
            emptyMessage="Nenhuma despesa cadastrada neste mês."
            emptyIcon={<Receipt size={40} aria-hidden="true" />}
            noResultsMessage="Nenhuma despesa encontrada com esses filtros."
            addLabel="Adicionar Despesa"
            footerLabel="despesas"
            statusOptions={EXPENSE_STATUS_OPTIONS}
            extraFilter={
              <Field label="Categoria" narrow>
                <SelectInput
                  value={expenseFilter.extra}
                  onChange={(event) => expenseFilter.setExtra(event.target.value)}
                >
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            }
            getRowKey={(expense) => String(expense.id)}
            getRowLabel={(expense) => `${expense.name} — ver detalhes`}
            renderActions={(expense) =>
              renderExpenseActions(expense, {
                onPay: expenseActions.openSettle,
                onUnpay: expenseActions.askUndo,
                onViewDetail: expenseActions.openDetail,
                onEdit: expenseActions.openEdit,
                onDelete: expenseActions.askDelete,
              })
            }
            onRowClick={expenseActions.openDetail}
            onAdd={expenseActions.openAdd}
          />
        ) : (
          <ItemsTab
            filter={incomeFilter}
            totalCount={month.incomes.length}
            columns={incomeColumns()}
            searchLabel="entrada"
            emptyMessage="Nenhuma entrada cadastrada neste mês."
            emptyIcon={<Wallet size={40} aria-hidden="true" />}
            noResultsMessage="Nenhuma entrada encontrada com esses filtros."
            addLabel="Adicionar Entrada"
            footerLabel="entradas"
            statusOptions={INCOME_STATUS_OPTIONS}
            getRowKey={(income) => String(income.id)}
            getRowLabel={(income) => `${income.name} — ver detalhes`}
            renderActions={(income) =>
              renderIncomeActions(income, {
                onReceive: incomeActions.openSettle,
                onUnreceive: incomeActions.askUndo,
                onViewDetail: incomeActions.openDetail,
                onEdit: incomeActions.openEdit,
                onDelete: incomeActions.askDelete,
              })
            }
            onRowClick={incomeActions.openDetail}
            onAdd={incomeActions.openAdd}
          />
        )}
      </Tabs>

      <PayDialog
        open={expenseActions.settleOpen}
        expense={settlingExpense}
        bankAccounts={bankAccounts}
        onClose={expenseActions.closeSettle}
        onConfirm={async (file, notes, paidAt, bankAccountId) => {
          if (!settlingExpense) return false;
          const saved = await pay(settlingExpense.id, file, notes, paidAt, bankAccountId);
          if (saved) expenseActions.closeSettle();
          return saved;
        }}
      />

      <AddExpenseDialog
        open={expenseActions.addOpen}
        onClose={expenseActions.closeAdd}
        onSubmit={addExpense}
      />

      {editingExpense && (
        <EditExpenseDialog
          key={expenseActions.editKey}
          open={expenseActions.editOpen}
          expense={editingExpense}
          onClose={expenseActions.closeEdit}
          onSubmit={(data) => editExpense(editingExpense.id, data)}
        />
      )}

      <ExpenseDetailDialog
        open={expenseActions.detailOpen}
        expense={expenseActions.detail}
        onClose={expenseActions.closeDetail}
      />

      <ItemActionDialogs
        actions={expenseActions}
        itemNoun="despesa"
        undoNoun="pagamento"
        undoConsequence={(expense) =>
          expense.receipt ? 'O comprovante anexado será removido.' : null
        }
      />

      <ReceiveDialog
        open={incomeActions.settleOpen}
        income={settlingIncome}
        bankAccounts={bankAccounts}
        onClose={incomeActions.closeSettle}
        onConfirm={async (notes, receivedAt, bankAccountId) => {
          if (!settlingIncome) return false;
          const saved = await receive(settlingIncome.id, notes, receivedAt, bankAccountId);
          if (saved) incomeActions.closeSettle();
          return saved;
        }}
      />

      <AddIncomeDialog
        open={incomeActions.addOpen}
        bankAccounts={bankAccounts}
        onClose={incomeActions.closeAdd}
        onSubmit={addIncome}
      />

      {editingIncome && (
        <EditIncomeDialog
          key={incomeActions.editKey}
          open={incomeActions.editOpen}
          income={editingIncome}
          bankAccounts={bankAccounts}
          onClose={incomeActions.closeEdit}
          onSubmit={(data) => editIncome(editingIncome.id, data)}
        />
      )}

      <IncomeDetailDialog
        open={incomeActions.detailOpen}
        income={incomeActions.detail}
        onClose={incomeActions.closeDetail}
      />

      <ItemActionDialogs actions={incomeActions} itemNoun="entrada" undoNoun="recebimento" />

      <ConfirmDialog
        open={deleteMonthOpen}
        title="Excluir mês?"
        message={
          <>
            Tem certeza que deseja excluir <strong>{month.label}</strong>? Todas as despesas e
            entradas do mês serão removidas.
          </>
        }
        loadingLabel="Excluindo..."
        loading={deleting}
        onClose={() => setDeleteMonthOpen(false)}
        onConfirm={handleDeleteMonth}
      />
    </div>
  );
}
