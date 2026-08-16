import {
  AccountBalance,
  Add as AddIcon,
  CalendarMonth,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  ImportExport,
  Label,
  Payments,
  PlaylistAdd as PlaylistAddIcon,
  ReceiptLong,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { BankAccount } from '@shared/types/bank-account';
import { Category } from '@shared/types/category';
import { DefaultExpense } from '@shared/types/expense';
import { DefaultIncome } from '@shared/types/income';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/ErrorState';
import { useBankAccounts } from '@/hooks/bank-accounts/useBankAccounts';
import { useCategories } from '@/hooks/categories/useCategories';
import { useDefaultExpenses } from '@/hooks/default-expenses/useDefaultExpenses';
import { useDefaultIncomes } from '@/hooks/default-incomes/useDefaultIncomes';
import { MAX_BATCH_MONTHS, useMonthRangeCreator } from '@/hooks/months/useMonthRangeCreator';
import { useDataTransfer } from '@/hooks/settings/useDataTransfer';
import { formatCurrencyBRL, formatCurrencyBRLOrFallback } from '@/utils/format';
import { BankAccountForm } from './components/BankAccountForm';
import { CategoryForm } from './components/CategoryForm';
import { DefaultExpenseForm } from './components/DefaultExpenseForm';
import { DefaultIncomeForm } from './components/DefaultIncomeForm';
import { MonthYearPicker } from './components/MonthYearPicker';

export function SettingsPage() {
  const { defaultExpenses, loading, error, retry, save, remove, reload } = useDefaultExpenses();
  const {
    defaultIncomes,
    loading: defaultIncomesLoading,
    save: saveDefaultIncome,
    remove: removeDefaultIncome,
    reload: reloadDefaultIncomes,
  } = useDefaultIncomes();
  const {
    bankAccounts,
    loading: bankAccountsLoading,
    save: saveBankAccount,
    remove: removeBankAccount,
    reload: reloadBankAccounts,
  } = useBankAccounts();
  const {
    categories,
    loading: categoriesLoading,
    save: saveCategory,
    remove: removeCategory,
    reload: reloadCategories,
  } = useCategories();
  const { range, setRange, creating, createRange, monthsCount, rangeValid } =
    useMonthRangeCreator();
  const { importing, exportData, importData } = useDataTransfer(() => {
    reload();
    reloadDefaultIncomes();
    reloadBankAccounts();
    reloadCategories();
  });

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

  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

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

  function handleSaveBankAccount(data: { name: string; balance?: number }) {
    saveBankAccount(data, editingBankAccount?.id).then((success) => {
      if (success) {
        setBankAccountFormOpen(false);
        setEditingBankAccount(null);
      }
    });
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
    saveCategory(data, editingCategory?.id).then((success) => {
      if (success) {
        setCategoryFormOpen(false);
        setEditingCategory(null);
      }
    });
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
    due_day?: number;
    amount: number;
    category_id?: number | null;
  }) {
    save(data, editingExpense?.id).then((success) => {
      if (success) {
        setFormOpen(false);
        setEditingExpense(null);
      }
    });
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
    expected_day?: number;
    amount: number;
    bank_account_id?: number | null;
  }) {
    saveDefaultIncome(data, editingIncome?.id).then((success) => {
      if (success) {
        setIncomeFormOpen(false);
        setEditingIncome(null);
      }
    });
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

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={280} height={48} sx={{ mb: 2 }} />
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={80} />
          <Skeleton variant="rounded" height={80} />
          <Skeleton variant="rounded" height={80} />
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Não foi possível carregar as configurações"
        error={error}
        onRetry={retry}
      />
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configurações
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Gerencie despesas e entradas padrão, categorias, contas e os dados do aplicativo.
      </Typography>

      <Stack spacing={3}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <AccountBalance fontSize="small" />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Contas Bancárias</Typography>
                <Typography variant="body2" color="text.secondary">
                  Usadas para debitar despesas ou creditar entradas
                </Typography>
              </Box>
              <Chip label={bankAccounts.length} size="small" />
              {bankAccounts.length > 0 && (
                <Chip
                  label={`Total: ${formatCurrencyBRL(totalBankBalance)}`}
                  size="small"
                  variant="outlined"
                  color={
                    totalBankBalance < 0 ? 'error' : totalBankBalance > 0 ? 'success' : 'default'
                  }
                />
              )}
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openAddBankAccount}
                size="small"
              >
                Adicionar
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {bankAccountsLoading ? (
              <Stack spacing={1}>
                <Skeleton variant="rounded" height={56} />
                <Skeleton variant="rounded" height={56} />
              </Stack>
            ) : bankAccounts.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <AccountBalance sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Nenhuma conta cadastrada.</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {bankAccounts.map((account) => (
                  <ListItem key={account.id} divider sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AccountBalance fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={account.name}
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondary={`Saldo: ${formatCurrencyBRL(account.balance)}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => openEditBankAccount(account)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => setDeleteBankAccountTarget(account)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 1 }}>
              <Avatar
                sx={{ bgcolor: 'action.selected', color: 'text.secondary', width: 40, height: 40 }}
              >
                <Label fontSize="small" />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Categorias</Typography>
                <Typography variant="body2" color="text.secondary">
                  Usadas para classificar despesas
                </Typography>
              </Box>
              <Chip label={categories.length} size="small" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openAddCategory}
                size="small"
              >
                Adicionar
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {categoriesLoading ? (
              <Stack spacing={1}>
                <Skeleton variant="rounded" height={56} />
                <Skeleton variant="rounded" height={56} />
              </Stack>
            ) : categories.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Label sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Nenhuma categoria cadastrada.</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {categories.map((category) => (
                  <ListItem key={category.id} divider sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: category.color }}>
                        <Label fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={category.name}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => openEditCategory(category)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => setDeleteCategoryTarget(category)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <ReceiptLong fontSize="small" />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Despesas Padrão</Typography>
                <Typography variant="body2" color="text.secondary">
                  Criadas automaticamente em cada novo mês
                </Typography>
              </Box>
              <Chip label={defaultExpenses.length} size="small" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} size="small">
                Adicionar
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {defaultExpenses.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <ReceiptLong sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Nenhuma despesa padrão cadastrada.</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {defaultExpenses.map((acc) => (
                  <ListItem key={acc.id} divider sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <ReceiptLong fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={acc.name}
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondary={`${formatCurrencyBRLOrFallback(acc.amount, 'Valor variável')}${acc.due_day ? ` - Vencimento dia ${acc.due_day}` : ''}${acc.category_name ? ` - ${acc.category_name}` : ''}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => openEdit(acc)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => setDeleteTarget(acc)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 1 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                <Payments fontSize="small" />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Entradas Padrão</Typography>
                <Typography variant="body2" color="text.secondary">
                  Criadas automaticamente em cada novo mês
                </Typography>
              </Box>
              <Chip label={defaultIncomes.length} size="small" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openAddIncome}
                size="small"
              >
                Adicionar
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {defaultIncomesLoading ? (
              <Stack spacing={1}>
                <Skeleton variant="rounded" height={56} />
                <Skeleton variant="rounded" height={56} />
              </Stack>
            ) : defaultIncomes.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Payments sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Nenhuma entrada padrão cadastrada.</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {defaultIncomes.map((inc) => (
                  <ListItem key={inc.id} divider sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <Payments fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={inc.name}
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondary={`${formatCurrencyBRLOrFallback(inc.amount, 'Valor variável')}${inc.expected_day ? ` - Previsto dia ${inc.expected_day}` : ''}${inc.bank_account_name ? ` - Conta: ${inc.bank_account_name}` : ''}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => openEditIncome(inc)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => setDeleteIncomeTarget(inc)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 1 }}>
              <Avatar
                sx={{ bgcolor: 'action.selected', color: 'text.secondary', width: 40, height: 40 }}
              >
                <CalendarMonth fontSize="small" />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Adicionar Meses</Typography>
                <Typography variant="body2" color="text.secondary">
                  Copia despesas e entradas padrão para novos meses
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={2} alignItems="flex-end" flexWrap="wrap" useFlexGap>
              <MonthYearPicker
                label="De:"
                month={range.fromMonth}
                year={range.fromYear}
                onMonthChange={(m) => setRange((p) => ({ ...p, fromMonth: m }))}
                onYearChange={(y) => setRange((p) => ({ ...p, fromYear: y }))}
              />
              <MonthYearPicker
                label="Até:"
                month={range.toMonth}
                year={range.toYear}
                onMonthChange={(m) => setRange((p) => ({ ...p, toMonth: m }))}
                onYearChange={(y) => setRange((p) => ({ ...p, toYear: y }))}
              />
              <Button
                variant="contained"
                onClick={createRange}
                disabled={creating || !rangeValid}
                startIcon={<PlaylistAddIcon />}
              >
                {creating ? 'Criando...' : 'Adicionar Meses'}
              </Button>
            </Stack>
            <Typography
              variant="caption"
              color={rangeValid ? 'text.secondary' : 'error'}
              sx={{ display: 'block', mt: 1 }}
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
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 1 }}>
              <Avatar
                sx={{ bgcolor: 'action.selected', color: 'text.secondary', width: 40, height: 40 }}
              >
                <ImportExport fontSize="small" />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Exportar / Importar Dados</Typography>
                <Typography variant="body2" color="text.secondary">
                  Backup completo em ZIP, com meses, despesas e comprovantes
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportData}>
                Exportar
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileUploadIcon />}
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
        onClose={() => setImportConfirmOpen(false)}
        onConfirm={handleConfirmImport}
      />
    </Box>
  );
}
