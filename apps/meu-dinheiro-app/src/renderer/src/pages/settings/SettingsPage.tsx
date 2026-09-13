import { Landmark, Receipt, Settings, Tag, Wallet } from 'lucide-react';
import { useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BankAccount } from '@shared/types/bank-account';
import { Category } from '@shared/types/category';
import { DefaultExpense } from '@shared/types/expense';
import { DefaultIncome } from '@shared/types/income';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { useBankAccounts } from '@/hooks/bank-accounts/useBankAccounts';
import { useCategories } from '@/hooks/categories/useCategories';
import { useDefaultExpenses } from '@/hooks/default-expenses/useDefaultExpenses';
import { useDefaultIncomes } from '@/hooks/default-incomes/useDefaultIncomes';
import { useMonthRangeCreator } from '@/hooks/months/useMonthRangeCreator';
import { useDataTransfer } from '@/hooks/settings/useDataTransfer';
import {
  SETTINGS_SECTIONS,
  SETTINGS_SECTION_PARAM,
  type SettingsSection,
  resolveSettingsSection,
} from '@/routes';
import { formatCurrency } from '@/utils/format';
import { useRegistryActions } from './hooks/useRegistryActions';
import { AddMonthsSection } from './components/AddMonthsSection';
import { BackupSection } from './components/BackupSection';
import { BankAccountForm } from './components/BankAccountForm';
import { CategoryForm } from './components/CategoryForm';
import { DefaultExpenseForm } from './components/DefaultExpenseForm';
import { DefaultIncomeForm } from './components/DefaultIncomeForm';
import { RegistrySection } from './components/RegistrySection';
import { SectionNav } from './components/SectionNav';
import {
  bankAccountColumns,
  categoryColumns,
  defaultExpenseColumns,
  defaultIncomeColumns,
  renderRowActions,
} from './components/columns';

/** O nome e a contagem de uma seção na navegação, fora do que ela carrega. */
const SECTION_TITLES: Record<SettingsSection, string> = {
  'bank-accounts': 'Contas bancárias',
  categories: 'Categorias',
  'default-expenses': 'Despesas padrão',
  'default-incomes': 'Entradas padrão',
  months: 'Adicionar Meses',
  backup: 'Backup',
};

/**
 * O que a navegação mostra de uma seção que carrega dados. Carregando vem
 * antes de erro (§5.3): uma seção que está recarregando não se anuncia como
 * falhada, mesmo que a leitura anterior tenha falhado.
 */
function navState(source: { loading: boolean; error: unknown }, count: number) {
  return { count, loading: source.loading, failed: !source.loading && !!source.error };
}

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = resolveSettingsSection(searchParams.get(SETTINGS_SECTION_PARAM));
  const titleId = useId();

  const accounts = useBankAccounts();
  const categories = useCategories();
  const defaultExpenses = useDefaultExpenses();
  const defaultIncomes = useDefaultIncomes();
  const { exporting, importing, exportData, importData } = useDataTransfer();
  // O intervalo mora na tela, e não na seção: com uma seção visível por vez,
  // um `De`/`Até` já escolhido não pode se perder porque o usuário foi
  // conferir uma conta bancária — e um lote em andamento tem de continuar
  // sendo o lote desta visita.
  const monthRange = useMonthRangeCreator();

  const accountActions = useRegistryActions<BankAccount>(accounts.remove);
  const categoryActions = useRegistryActions<Category>(categories.remove);
  const expenseActions = useRegistryActions<DefaultExpense>(defaultExpenses.remove);
  const incomeActions = useRegistryActions<DefaultIncome>(defaultIncomes.remove);

  const [importConfirmOpen, setImportConfirmOpen] = useState(false);

  /**
   * A seção aberta mora na rota, e não só no estado: é assim que a orientação
   * inicial da Visão Geral aponta para o passo que ela pede. Trocar de seção
   * **substitui** a entrada do histórico — voltar é sair de Configurações, não
   * desfazer a escolha de assunto.
   */
  function selectSection(next: SettingsSection) {
    setSearchParams({ [SETTINGS_SECTION_PARAM]: next }, { replace: true });
  }

  const totalBankBalance = accounts.bankAccounts.reduce((sum, account) => sum + account.balance, 0);

  /**
   * A ordem e o conjunto das seções vêm da rota, que é quem as declara; aqui
   * cada uma ganha o que só a tela sabe. O `Record` é o que garante que uma
   * seção nova não possa ser esquecida deste lado.
   */
  const sectionData: Record<
    SettingsSection,
    { count?: number; loading?: boolean; failed?: boolean }
  > = {
    'bank-accounts': navState(accounts, accounts.bankAccounts.length),
    categories: navState(categories, categories.categories.length),
    'default-expenses': navState(defaultExpenses, defaultExpenses.defaultExpenses.length),
    'default-incomes': navState(defaultIncomes, defaultIncomes.defaultIncomes.length),
    months: {},
    backup: {},
  };

  const sections = SETTINGS_SECTIONS.map((id) => ({
    id,
    title: SECTION_TITLES[id],
    ...sectionData[id],
  }));

  /**
   * Mês criado copia os padrões de hoje, então um lote criado sem padrão
   * nenhum nasce vazio — e quem está aqui provavelmente não quer isso. O aviso
   * leva para onde o cadastro é feito, em vez de só constatar a ausência.
   */
  const noDefaults =
    !defaultExpenses.loading &&
    !defaultIncomes.loading &&
    !defaultExpenses.error &&
    !defaultIncomes.error &&
    defaultExpenses.defaultExpenses.length === 0 &&
    defaultIncomes.defaultIncomes.length === 0;

  return (
    <div className="money-page">
      <PageHeader
        icon={<Settings size={22} aria-hidden="true" />}
        title="Configurações"
        subtitle="Cadastros que alimentam os meses, criação de meses em lote e backup dos dados."
      />

      <div className="money-settings">
        <SectionNav sections={sections} value={section} onChange={selectSection} />

        <section className="money-settings-panel" aria-labelledby={titleId}>
          {section === 'bank-accounts' && (
            <RegistrySection
              icon={Landmark}
              accent="primary"
              title="Contas bancárias"
              description="De onde saem os pagamentos e para onde entram os recebimentos."
              titleId={titleId}
              extra={
                accounts.bankAccounts.length > 0 && (
                  // Só o negativo é pintado, como a coluna de Realizado da Visão
                  // Geral: saldo positivo é o estado normal, não um aviso (§1.5).
                  <span
                    className="money-chip"
                    data-variant="outline"
                    data-tone={totalBankBalance < 0 ? 'alert' : undefined}
                  >
                    Total: {formatCurrency(totalBankBalance)}
                  </span>
                )
              }
              items={accounts.bankAccounts}
              loading={accounts.loading}
              error={accounts.error}
              onRetry={accounts.retry}
              errorTitle="Não foi possível carregar as contas"
              columns={bankAccountColumns}
              getRowKey={(account) => String(account.id)}
              renderActions={(account) =>
                renderRowActions(account, 'Excluir conta', {
                  onEdit: accountActions.openEdit,
                  onDelete: accountActions.askDelete,
                })
              }
              footerLabel="contas"
              addLabel="Adicionar conta"
              onAdd={accountActions.openAdd}
              emptyTitle="Nenhuma conta cadastrada."
              emptyDescription="Contas bancárias ligam uma conta a pagar ao dinheiro real."
            />
          )}

          {section === 'categories' && (
            <RegistrySection
              icon={Tag}
              accent="warning"
              title="Categorias"
              description="Classificam as despesas e alimentam a distribuição do Histórico."
              titleId={titleId}
              items={categories.categories}
              loading={categories.loading}
              error={categories.error}
              onRetry={categories.retry}
              errorTitle="Não foi possível carregar as categorias"
              columns={categoryColumns}
              getRowKey={(category) => String(category.id)}
              renderActions={(category) =>
                renderRowActions(category, 'Excluir categoria', {
                  onEdit: categoryActions.openEdit,
                  onDelete: categoryActions.askDelete,
                })
              }
              footerLabel="categorias"
              addLabel="Adicionar categoria"
              onAdd={categoryActions.openAdd}
              emptyTitle="Nenhuma categoria cadastrada."
              emptyDescription="Sem categorias, as despesas ficam todas em Sem categoria."
            />
          )}

          {section === 'default-expenses' && (
            <RegistrySection
              icon={Receipt}
              accent="secondary"
              title="Despesas padrão"
              description="Lançadas em todo mês novo — e nos meses já criados, ao cadastrar."
              titleId={titleId}
              items={defaultExpenses.defaultExpenses}
              loading={defaultExpenses.loading}
              error={defaultExpenses.error}
              onRetry={defaultExpenses.retry}
              errorTitle="Não foi possível carregar as despesas padrão"
              columns={defaultExpenseColumns}
              getRowKey={(expense) => String(expense.id)}
              renderActions={(expense) =>
                renderRowActions(expense, 'Excluir despesa padrão', {
                  onEdit: expenseActions.openEdit,
                  onDelete: expenseActions.askDelete,
                })
              }
              footerLabel="despesas padrão"
              addLabel="Adicionar despesa padrão"
              onAdd={expenseActions.openAdd}
              emptyTitle="Nenhuma despesa padrão cadastrada."
              emptyDescription="Todo mês novo nasce com uma cópia das despesas padrão."
            />
          )}

          {section === 'default-incomes' && (
            <RegistrySection
              icon={Wallet}
              accent="success"
              title="Entradas padrão"
              description="Lançadas em todo mês novo — e nos meses já criados, ao cadastrar."
              titleId={titleId}
              items={defaultIncomes.defaultIncomes}
              loading={defaultIncomes.loading}
              error={defaultIncomes.error}
              onRetry={defaultIncomes.retry}
              errorTitle="Não foi possível carregar as entradas padrão"
              columns={defaultIncomeColumns}
              getRowKey={(income) => String(income.id)}
              renderActions={(income) =>
                renderRowActions(income, 'Excluir entrada padrão', {
                  onEdit: incomeActions.openEdit,
                  onDelete: incomeActions.askDelete,
                })
              }
              footerLabel="entradas padrão"
              addLabel="Adicionar entrada padrão"
              onAdd={incomeActions.openAdd}
              emptyTitle="Nenhuma entrada padrão cadastrada."
              emptyDescription="Todo mês novo nasce com uma cópia das entradas padrão."
            />
          )}

          {section === 'months' && (
            <AddMonthsSection
              titleId={titleId}
              creator={monthRange}
              emptyDefaultsNote={
                noDefaults && (
                  <div className="money-inline-note">
                    <p className="money-description">
                      Não há despesas nem entradas padrão cadastradas: os meses criados agora nascem
                      vazios.
                    </p>
                    <div className="money-state-actions">
                      <Button onClick={() => selectSection('default-expenses')}>
                        Cadastrar despesas padrão
                      </Button>
                      <Button onClick={() => selectSection('default-incomes')}>
                        Cadastrar entradas padrão
                      </Button>
                    </div>
                  </div>
                )
              }
            />
          )}

          {section === 'backup' && (
            <BackupSection
              titleId={titleId}
              exporting={exporting}
              importing={importing}
              onExport={exportData}
              onAskImport={() => setImportConfirmOpen(true)}
            />
          )}
        </section>
      </div>

      <BankAccountForm
        key={`account-${accountActions.formKey}`}
        open={accountActions.formOpen}
        onClose={accountActions.closeForm}
        onSave={(data) => accounts.save(data, accountActions.editing?.id)}
        initial={accountActions.editing}
      />

      <ConfirmDialog
        open={!!accountActions.deleteTarget}
        title="Excluir conta?"
        message={
          <>
            Tem certeza que deseja excluir <strong>{accountActions.deleteTarget?.name}</strong>?
            Despesas já pagas com essa conta deixarão de referenciá-la, mas o pagamento em si não
            será desfeito.
          </>
        }
        loading={accountActions.deleting}
        loadingLabel="Excluindo..."
        onClose={accountActions.cancelDelete}
        onConfirm={accountActions.confirmDelete}
      />

      <CategoryForm
        key={`category-${categoryActions.formKey}`}
        open={categoryActions.formOpen}
        onClose={categoryActions.closeForm}
        onSave={(data) => categories.save(data, categoryActions.editing?.id)}
        initial={categoryActions.editing}
      />

      <ConfirmDialog
        open={!!categoryActions.deleteTarget}
        title="Excluir categoria?"
        message={
          <>
            Tem certeza que deseja excluir <strong>{categoryActions.deleteTarget?.name}</strong>?
            Despesas que usam essa categoria ficarão sem categoria.
          </>
        }
        loading={categoryActions.deleting}
        loadingLabel="Excluindo..."
        onClose={categoryActions.cancelDelete}
        onConfirm={categoryActions.confirmDelete}
      />

      <DefaultExpenseForm
        key={`default-expense-${expenseActions.formKey}`}
        open={expenseActions.formOpen}
        onClose={expenseActions.closeForm}
        onSave={(data) => defaultExpenses.save(data, expenseActions.editing?.id)}
        initial={expenseActions.editing}
      />

      <ConfirmDialog
        open={!!expenseActions.deleteTarget}
        title="Excluir despesa padrão?"
        message={
          <>
            Tem certeza que deseja excluir <strong>{expenseActions.deleteTarget?.name}</strong>? Ela
            deixará de ser criada automaticamente nos próximos meses; os meses já criados ficam como
            estão.
          </>
        }
        loading={expenseActions.deleting}
        loadingLabel="Excluindo..."
        onClose={expenseActions.cancelDelete}
        onConfirm={expenseActions.confirmDelete}
      />

      <DefaultIncomeForm
        key={`default-income-${incomeActions.formKey}`}
        open={incomeActions.formOpen}
        bankAccounts={accounts.bankAccounts}
        onClose={incomeActions.closeForm}
        onSave={(data) => defaultIncomes.save(data, incomeActions.editing?.id)}
        initial={incomeActions.editing}
      />

      <ConfirmDialog
        open={!!incomeActions.deleteTarget}
        title="Excluir entrada padrão?"
        message={
          <>
            Tem certeza que deseja excluir <strong>{incomeActions.deleteTarget?.name}</strong>? Ela
            deixará de ser criada automaticamente nos próximos meses; os meses já criados ficam como
            estão.
          </>
        }
        loading={incomeActions.deleting}
        loadingLabel="Excluindo..."
        onClose={incomeActions.cancelDelete}
        onConfirm={incomeActions.confirmDelete}
      />

      {/* A substituição é declarada antes do seletor de arquivo: escolher o
          arquivo primeiro faria a confirmação chegar depois da decisão. */}
      <ConfirmDialog
        open={importConfirmOpen}
        title="Importar dados?"
        message={
          <>
            Você vai escolher um arquivo ZIP exportado anteriormente. A importação vai{' '}
            <strong>substituir todos os dados atuais</strong> (meses, despesas, entradas, cadastros
            e comprovantes). Essa ação não pode ser desfeita.
          </>
        }
        confirmLabel="Escolher arquivo"
        onClose={() => setImportConfirmOpen(false)}
        onConfirm={async () => {
          setImportConfirmOpen(false);
          await importData();
        }}
      />
    </div>
  );
}
