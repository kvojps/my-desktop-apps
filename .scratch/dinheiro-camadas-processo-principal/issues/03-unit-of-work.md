Status: aberto
Blocked by: 02

# Meu Dinheiro: unit of work

`infra/database/index.ts` passa a exportar `makeRepositories(db)`, agregando os repositórios e
a transação — mesma forma de
`.scratch/camadas-processo-principal/issues/05-dlog-unit-of-work.md` e
`.scratch/negocio-camadas-processo-principal/issues/03-unit-of-work.md`:

```ts
export function makeRepositories(db: Database.Database) {
  return {
    months: makeMonthsRepository(db),
    expenses: makeExpensesRepository(db),
    incomes: makeIncomesRepository(db),
    defaultExpenses: makeDefaultExpensesRepository(db),
    defaultIncomes: makeDefaultIncomesRepository(db),
    bankAccounts: makeBankAccountsRepository(db),
    categories: makeCategoriesRepository(db),
    appSettings: makeAppSettingsRepository(db),
    transaction: <T>(fn: () => T): T => db.transaction(fn)(),
    importBackup: (data: BackupData): void => importData(db, data),
  };
}
export type Repositories = ReturnType<typeof makeRepositories>;
```

Cada repositório vira fábrica de closures sobre `db` — funcional, sem classes.

## Verbos

`months`, `expenses`, `incomes`, `defaultExpenses`, `defaultIncomes`, `bankAccounts`,
`categories` aplicam `list` / `findById` / `create` / `update` / `delete`, **sempre devolvendo
`null` — nunca lançando**. Os `getXRow` que hoje lançam `AppError(404)`
(`getMonthWithExpenses`, `getExpenseRow`, `getIncomeRow`, `getBankAccountRow`,
`getCategoryRow`, `getDefaultExpenseRow`, `getDefaultIncomeRow`) viram `findById` devolvendo
`null`. O 404 é decisão do service (ticket 05).

`appSettingsRepository` segue o precedente já registrado nos comentários do ticket 05 do
`git-dlog` e do ticket 03 do `meu-negocio-app`: tabela chave-valor, sem entidade a listar nem
id a buscar — mantém verbos próprios (`getAppSetting`/`setAppSetting`/`deleteAppSetting`).

### Verbos novos para o NULL de referência

`deleteCategory` e `deleteBankAccount` hoje fazem, dentro de um `db.transaction`, o NULL das
colunas que referenciam a linha e depois o DELETE. A transação composta é do service (ticket
05); para o service conseguir compor, os repositórios ganham os verbos que faltam:

- `repos.expenses.clearCategory(categoryId)` e `repos.defaultExpenses.clearCategory(categoryId)`
- `repos.expenses.clearBankAccount(bankAccountId)` e `repos.incomes.clearBankAccount(bankAccountId)`

Cada um é um `UPDATE … SET <col> = NULL WHERE <col> = ?`, sem transação própria.

## O que NÃO entra aqui

- **Nenhuma regra migra.** Competência, rollover, cascata de padrões, débito/crédito de conta,
  batch com sucesso parcial, marcação da competência excluída — tudo continua onde está, só
  fechado sobre `db` em vez de recebê-lo por parâmetro. A migração para
  `repos.transaction(fn)` autorada pelo service é o ticket 05.
- **`db.transaction` continua nos repositórios por enquanto** — os ~11 call sites seguem onde
  estão. `transaction()` do unit of work nasce sem call site real; ganha uso no ticket 05.
- **`registerIpc.ts` traduz `null` → `AppError(404)` provisoriamente**, nos pontos que hoje
  lançavam, para preservar o comportamento observável até o service existir.
- `importData(db, data)` continua sobre `db` cru — apagar e reescrever sete tabelas numa
  transação só não é sequência de verbos de entidade. `importBackup` só o embrulha no unit of
  work, com comentário explicando o porquê.

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`. Nenhum repositório deve ter
`throw` restante — todo caminho de "não encontrado" devolve `null`. `npm run dev:dinheiro`:
comportamento idêntico, inclusive os 404 (agora traduzidos no `registerIpc.ts`).

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisões 6, 7, 12, 13).
