import {
  AccountBalanceOutlined,
  Add,
  CalendarMonthOutlined,
  ExpandMore,
  FileDownload,
  FileUpload,
  ImportExportOutlined,
  LabelOutlined,
  PaymentsOutlined,
  PlaylistAdd,
  ReceiptLongOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useId, useState } from 'react';
import { BankAccount } from '@shared/types/bank-account';
import { Category } from '@shared/types/category';
import { DefaultExpense } from '@shared/types/expense';
import { DefaultIncome } from '@shared/types/income';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { useBankAccounts } from '@/hooks/bank-accounts/useBankAccounts';
import { useCategories } from '@/hooks/categories/useCategories';
import { useDefaultExpenses } from '@/hooks/default-expenses/useDefaultExpenses';
import { useDefaultIncomes } from '@/hooks/default-incomes/useDefaultIncomes';
import { MAX_BATCH_MONTHS, useMonthRangeCreator } from '@/hooks/months/useMonthRangeCreator';
import { useDataTransfer } from '@/hooks/settings/useDataTransfer';
import { formatCurrency } from '@/utils/format';
import { BankAccountForm } from './components/BankAccountForm';
import { CategoryForm } from './components/CategoryForm';
import { DefaultExpenseForm } from './components/DefaultExpenseForm';
import { DefaultIncomeForm } from './components/DefaultIncomeForm';
import { MonthYearPicker } from './components/MonthYearPicker';
import { SectionHeader } from './components/SectionHeader';
import {
  bankAccountColumns,
  categoryColumns,
  defaultExpenseColumns,
  defaultIncomeColumns,
  renderRowActions,
} from './components/columns';

export function SettingsPage() {
  const {
    defaultExpenses,
    loading: defaultExpensesLoading,
    error: defaultExpensesError,
    retry: retryDefaultExpenses,
    save,
    remove,
  } = useDefaultExpenses();
  const {
    defaultIncomes,
    loading: defaultIncomesLoading,
    error: defaultIncomesError,
    retry: retryDefaultIncomes,
    save: saveDefaultIncome,
    remove: removeDefaultIncome,
  } = useDefaultIncomes();
  const {
    bankAccounts,
    loading: bankAccountsLoading,
    error: bankAccountsError,
    retry: retryBankAccounts,
    save: saveBankAccount,
    remove: removeBankAccount,
  } = useBankAccounts();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
    save: saveCategory,
    remove: removeCategory,
  } = useCategories();
  const { range, setRange, creating, createRange, monthsCount, rangeValid } =
    useMonthRangeCreator();
  const { importing, exportData, importData } = useDataTransfer();

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DefaultExpense | null>(null);
  const [formKey, setFormKey] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<DefaultExpense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [incomeFormOpen, setIncomeFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<DefaultIncome | null>(null);
  const [incomeFormKey, setIncomeFormKey] = useState(0);

  const [deleteIncomeTarget, setDeleteIncomeTarget] = useState<DefaultIncome | null>(null);
  const [deletingIncome, setDeletingIncome] = useState(false);

  const [bankAccountFormOpen, setBankAccountFormOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [bankAccountFormKey, setBankAccountFormKey] = useState(0);

  const [deleteBankAccountTarget, setDeleteBankAccountTarget] = useState<BankAccount | null>(null);
  const [deletingBankAccount, setDeletingBankAccount] = useState(false);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormKey, setCategoryFormKey] = useState(0);

  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const [importConfirmOpen, setImportConfirmOpen] = useState(false);

  const rangeHintId = useId();

  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

  /**
   * Cada seção carrega e falha por conta própria, mas as quatro falharem ao
   * mesmo tempo não é quatro problemas: é o banco fora do ar. Como os acordeões
   * nascem fechados, esse caso precisa aparecer na página — um erro escondido
   * atrás de um acordeão fechado não é um erro visível.
   */
  const sections = [
    { loading: bankAccountsLoading, error: bankAccountsError, retry: retryBankAccounts },
    { loading: categoriesLoading, error: categoriesError, retry: retryCategories },
    { loading: defaultExpensesLoading, error: defaultExpensesError, retry: retryDefaultExpenses },
    { loading: defaultIncomesLoading, error: defaultIncomesError, retry: retryDefaultIncomes },
  ];
  const everySectionLoading = sections.every((section) => section.loading);
  const everySectionFailed = sections.every((section) => section.error);

  function retryEverySection() {
    sections.forEach((section) => section.retry());
  }

  function openEditBankAccount(account: BankAccount) {
    setEditingBankAccount(account);
    setBankAccountFormKey((k) => k + 1);
    setBankAccountFormOpen(true);
  }

  function openAddBankAccount() {
    setEditingBankAccount(null);
    setBankAccountFormKey((k) => k + 1);
    setBankAccountFormOpen(true);
  }

  // Os formulários fecham sozinhos quando o save dá certo, e por isso precisam
  // da promessa de volta: é ela que trava o botão enquanto o save corre.
  function handleSaveBankAccount(data: { name: string; balance?: number }) {
    return saveBankAccount(data, editingBankAccount?.id);
  }

  async function handleConfirmDeleteBankAccount() {
    if (!deleteBankAccountTarget) return;
    setDeletingBankAccount(true);
    await removeBankAccount(deleteBankAccountTarget.id);
    setDeletingBankAccount(false);
    setDeleteBankAccountTarget(null);
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryFormKey((k) => k + 1);
    setCategoryFormOpen(true);
  }

  function openAddCategory() {
    setEditingCategory(null);
    setCategoryFormKey((k) => k + 1);
    setCategoryFormOpen(true);
  }

  function handleSaveCategory(data: { name: string; color: string }) {
    return saveCategory(data, editingCategory?.id);
  }

  async function handleConfirmDeleteCategory() {
    if (!deleteCategoryTarget) return;
    setDeletingCategory(true);
    await removeCategory(deleteCategoryTarget.id);
    setDeletingCategory(false);
    setDeleteCategoryTarget(null);
  }

  function openEdit(expense: DefaultExpense) {
    setEditingExpense(expense);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openAdd() {
    setEditingExpense(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleSaveDefault(data: {
    name: string;
    dueDay?: number;
    amount: number;
    categoryId?: number | null;
  }) {
    return save(data, editingExpense?.id);
  }

  function openEditIncome(income: DefaultIncome) {
    setEditingIncome(income);
    setIncomeFormKey((k) => k + 1);
    setIncomeFormOpen(true);
  }

  function openAddIncome() {
    setEditingIncome(null);
    setIncomeFormKey((k) => k + 1);
    setIncomeFormOpen(true);
  }

  function handleSaveDefaultIncome(data: {
    name: string;
    expectedDay?: number;
    amount: number;
    bankAccountId?: number | null;
  }) {
    return saveDefaultIncome(data, editingIncome?.id);
  }

  async function handleConfirmDeleteIncome() {
    if (!deleteIncomeTarget) return;
    setDeletingIncome(true);
    await removeDefaultIncome(deleteIncomeTarget.id);
    setDeletingIncome(false);
    setDeleteIncomeTarget(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await remove(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  async function handleConfirmImport() {
    setImportConfirmOpen(false);
    await importData();
  }

  /** O botão de criar da seção, repetido no estado vazio onde o olho já está. */
  function addButton(onClick: () => void) {
    return (
      <Button variant="contained" startIcon={<Add />} onClick={onClick} size="small">
        Adicionar
      </Button>
    );
  }

  if (everySectionLoading) {
    return (
      /* Mesma forma da tela pronta — cabeçalho e as seis seções fechadas, na
         altura real do `AccordionSummary` —, para nada saltar quando os dados
         chegam. */
      <Stack spacing={3}>
        <Skeleton variant="text" width={280} height={48} />
        <Stack spacing={3}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={72} />
          ))}
        </Stack>
      </Stack>
    );
  }

  if (everySectionFailed) {
    return (
      <ErrorState
        title="Não foi possível carregar as configurações"
        error={defaultExpensesError}
        onRetry={retryEverySection}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<SettingsOutlined />}
        title="Configurações"
        subtitle="Gerencie despesas e entradas padrão, categorias, contas e os dados do aplicativo."
      />

      <Stack spacing={3}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <SectionHeader
              icon={AccountBalanceOutlined}
              accent="primary"
              title="Contas Bancárias"
              description="Usadas para debitar despesas ou creditar entradas"
              count={bankAccounts.length}
              loading={bankAccountsLoading}
              extra={
                bankAccounts.length > 0 && (
                  // Só o negativo é pintado, como a coluna de Realizado da Visão
                  // Geral: saldo positivo é o estado normal, não um aviso (§1.5).
                  <Chip
                    label={`Total: ${formatCurrency(totalBankBalance)}`}
                    size="small"
                    variant="outlined"
                    color={totalBankBalance < 0 ? 'error' : 'default'}
                  />
                )
              }
            />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {addButton(openAddBankAccount)}
              </Box>
              {bankAccountsError ? (
                <ErrorState
                  title="Não foi possível carregar as contas"
                  error={bankAccountsError}
                  onRetry={retryBankAccounts}
                  dense
                />
              ) : (
                <DataTable
                  flush
                  columns={bankAccountColumns}
                  items={bankAccounts}
                  totalCount={bankAccounts.length}
                  start={0}
                  isLoading={bankAccountsLoading}
                  getRowKey={(account) => String(account.id)}
                  footerLabel="contas"
                  renderActions={(account) =>
                    renderRowActions(account, 'Excluir conta', {
                      onEdit: openEditBankAccount,
                      onDelete: setDeleteBankAccountTarget,
                    })
                  }
                  empty={
                    <EmptyState
                      icon={<AccountBalanceOutlined sx={{ fontSize: 40 }} />}
                      title="Nenhuma conta cadastrada."
                      description="Contas bancárias ligam uma conta a pagar ao dinheiro real."
                      action={addButton(openAddBankAccount)}
                    />
                  }
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <SectionHeader
              icon={LabelOutlined}
              accent="warning"
              title="Categorias"
              description="Usadas para classificar despesas"
              count={categories.length}
              loading={categoriesLoading}
            />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {addButton(openAddCategory)}
              </Box>
              {categoriesError ? (
                <ErrorState
                  title="Não foi possível carregar as categorias"
                  error={categoriesError}
                  onRetry={retryCategories}
                  dense
                />
              ) : (
                <DataTable
                  flush
                  columns={categoryColumns}
                  items={categories}
                  totalCount={categories.length}
                  start={0}
                  isLoading={categoriesLoading}
                  getRowKey={(category) => String(category.id)}
                  footerLabel="categorias"
                  renderActions={(category) =>
                    renderRowActions(category, 'Excluir categoria', {
                      onEdit: openEditCategory,
                      onDelete: setDeleteCategoryTarget,
                    })
                  }
                  empty={
                    <EmptyState
                      icon={<LabelOutlined sx={{ fontSize: 40 }} />}
                      title="Nenhuma categoria cadastrada."
                      description="Categorias classificam as despesas e alimentam o Histórico."
                      action={addButton(openAddCategory)}
                    />
                  }
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <SectionHeader
              icon={ReceiptLongOutlined}
              accent="secondary"
              title="Despesas Padrão"
              description="Criadas automaticamente em cada novo mês"
              count={defaultExpenses.length}
              loading={defaultExpensesLoading}
            />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>{addButton(openAdd)}</Box>
              {defaultExpensesError ? (
                <ErrorState
                  title="Não foi possível carregar as despesas padrão"
                  error={defaultExpensesError}
                  onRetry={retryDefaultExpenses}
                  dense
                />
              ) : (
                <DataTable
                  flush
                  columns={defaultExpenseColumns}
                  items={defaultExpenses}
                  totalCount={defaultExpenses.length}
                  start={0}
                  isLoading={defaultExpensesLoading}
                  getRowKey={(expense) => String(expense.id)}
                  footerLabel="despesas padrão"
                  renderActions={(expense) =>
                    renderRowActions(expense, 'Excluir despesa padrão', {
                      onEdit: openEdit,
                      onDelete: setDeleteTarget,
                    })
                  }
                  empty={
                    <EmptyState
                      icon={<ReceiptLongOutlined sx={{ fontSize: 40 }} />}
                      title="Nenhuma despesa padrão cadastrada."
                      description="Todo mês novo nasce com uma cópia das despesas padrão."
                      action={addButton(openAdd)}
                    />
                  }
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <SectionHeader
              icon={PaymentsOutlined}
              accent="success"
              title="Entradas Padrão"
              description="Criadas automaticamente em cada novo mês"
              count={defaultIncomes.length}
              loading={defaultIncomesLoading}
            />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {addButton(openAddIncome)}
              </Box>
              {defaultIncomesError ? (
                <ErrorState
                  title="Não foi possível carregar as entradas padrão"
                  error={defaultIncomesError}
                  onRetry={retryDefaultIncomes}
                  dense
                />
              ) : (
                <DataTable
                  flush
                  columns={defaultIncomeColumns}
                  items={defaultIncomes}
                  totalCount={defaultIncomes.length}
                  start={0}
                  isLoading={defaultIncomesLoading}
                  getRowKey={(income) => String(income.id)}
                  footerLabel="entradas padrão"
                  renderActions={(income) =>
                    renderRowActions(income, 'Excluir entrada padrão', {
                      onEdit: openEditIncome,
                      onDelete: setDeleteIncomeTarget,
                    })
                  }
                  empty={
                    <EmptyState
                      icon={<PaymentsOutlined sx={{ fontSize: 40 }} />}
                      title="Nenhuma entrada padrão cadastrada."
                      description="Todo mês novo nasce com uma cópia das entradas padrão."
                      action={addButton(openAddIncome)}
                    />
                  }
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <SectionHeader
              icon={CalendarMonthOutlined}
              title="Adicionar Meses"
              description="Copia despesas e entradas padrão para novos meses"
            />
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={2} alignItems="flex-end" flexWrap="wrap" useFlexGap>
              <MonthYearPicker
                label="De"
                month={range.fromMonth}
                year={range.fromYear}
                onMonthChange={(m) => setRange((p) => ({ ...p, fromMonth: m }))}
                onYearChange={(y) => setRange((p) => ({ ...p, fromYear: y }))}
              />
              <MonthYearPicker
                label="Até"
                month={range.toMonth}
                year={range.toYear}
                onMonthChange={(m) => setRange((p) => ({ ...p, toMonth: m }))}
                onYearChange={(y) => setRange((p) => ({ ...p, toYear: y }))}
              />
              {/* Botão desabilitado não diz por quê; a legenda abaixo diz, e o
                  `aria-describedby` é o que a entrega junto com ele (§5.5). */}
              <Button
                variant="contained"
                onClick={createRange}
                disabled={creating || !rangeValid}
                aria-describedby={rangeHintId}
                startIcon={<PlaylistAdd />}
              >
                {creating ? 'Criando...' : 'Adicionar Meses'}
              </Button>
            </Stack>
            <Typography
              id={rangeHintId}
              variant="caption"
              sx={{ display: 'block', mt: 1, color: rangeValid ? 'text.secondary' : 'error.main' }}
            >
              {monthsCount > 0
                ? `Isso vai criar até ${monthsCount} ${monthsCount === 1 ? 'mês' : 'meses'} (meses já existentes serão ignorados).`
                : 'Selecione um intervalo válido.'}
              {monthsCount > MAX_BATCH_MONTHS &&
                ` O intervalo não pode ultrapassar ${MAX_BATCH_MONTHS} meses.`}
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <SectionHeader
              icon={ImportExportOutlined}
              title="Exportar / Importar Dados"
              description="Backup completo em ZIP, com meses, despesas e comprovantes"
            />
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" startIcon={<FileDownload />} onClick={exportData}>
                Exportar
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileUpload />}
                disabled={importing}
                onClick={() => setImportConfirmOpen(true)}
              >
                {importing ? 'Importando...' : 'Importar'}
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <DefaultExpenseForm
        key={formKey}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveDefault}
        initial={editingExpense}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir despesa padrão?"
        message={
          <>
            Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Ela deixará de ser
            criada automaticamente nos próximos meses.
          </>
        }
        loading={deleting}
        loadingLabel="Excluindo..."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <DefaultIncomeForm
        key={incomeFormKey}
        open={incomeFormOpen}
        bankAccounts={bankAccounts}
        onClose={() => {
          setIncomeFormOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveDefaultIncome}
        initial={editingIncome}
      />

      <ConfirmDialog
        open={!!deleteIncomeTarget}
        title="Excluir entrada padrão?"
        message={
          <>
            Tem certeza que deseja excluir <strong>{deleteIncomeTarget?.name}</strong>? Ela deixará
            de ser criada automaticamente nos próximos meses.
          </>
        }
        loading={deletingIncome}
        loadingLabel="Excluindo..."
        onClose={() => setDeleteIncomeTarget(null)}
        onConfirm={handleConfirmDeleteIncome}
      />

      <BankAccountForm
        key={bankAccountFormKey}
        open={bankAccountFormOpen}
        onClose={() => {
          setBankAccountFormOpen(false);
          setEditingBankAccount(null);
        }}
        onSave={handleSaveBankAccount}
        initial={editingBankAccount}
      />

      <ConfirmDialog
        open={!!deleteBankAccountTarget}
        title="Excluir conta?"
        message={
          <>
            Tem certeza que deseja excluir <strong>{deleteBankAccountTarget?.name}</strong>?
            Despesas já pagas com essa conta deixarão de referenciá-la, mas o pagamento em si não
            será desfeito.
          </>
        }
        loading={deletingBankAccount}
        loadingLabel="Excluindo..."
        onClose={() => setDeleteBankAccountTarget(null)}
        onConfirm={handleConfirmDeleteBankAccount}
      />

      <CategoryForm
        key={categoryFormKey}
        open={categoryFormOpen}
        onClose={() => {
          setCategoryFormOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        initial={editingCategory}
      />

      <ConfirmDialog
        open={!!deleteCategoryTarget}
        title="Excluir categoria?"
        message={
          <>
            Tem certeza que deseja excluir <strong>{deleteCategoryTarget?.name}</strong>? Despesas
            que usam essa categoria ficarão sem categoria.
          </>
        }
        loading={deletingCategory}
        loadingLabel="Excluindo..."
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={handleConfirmDeleteCategory}
      />

      <ConfirmDialog
        open={importConfirmOpen}
        title="Importar dados?"
        message={
          <>
            Escolha um arquivo ZIP exportado anteriormente. A importação vai{' '}
            <strong>substituir todos os dados atuais</strong> (meses, despesas e comprovantes). Essa
            ação não pode ser desfeita.
          </>
        }
        confirmLabel="Escolher arquivo"
        loading={importing}
        loadingLabel="Importando..."
        onClose={() => setImportConfirmOpen(false)}
        onConfirm={handleConfirmImport}
      />
    </Stack>
  );
}
