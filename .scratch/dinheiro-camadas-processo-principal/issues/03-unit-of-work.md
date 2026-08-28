Status: resolvido
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

### 2026-08-27 — implementado

`infra/database/index.ts` nasceu com a forma exata do skeleton: `makeRepositories(db)`
agregando os oito repositórios, `transaction()` e `importBackup()`, mais `type Repositories`.
Os oito repositórios viraram fábricas de closures sobre `db` — nenhuma classe, nenhum `db`
atravessando assinatura pública de verbo. `registerIpc.ts` monta `const repos = makeRepositories(db)`
uma vez no topo e todos os ~45 call sites antigos passaram a `repos.<domínio>.<verbo>`.

Contrato de verbos aplicado: `list` (era `listX`/`listXForMonth` → `listForMonth` onde havia
`monthId`), `findById` (os sete `getXRow` que lançavam 404 agora devolvem `null`), `create`,
`update`, `delete` — todos devolvendo `null`, nunca lançando, para "não encontrado". `months`
mantém `createNext`/`createBatch` (era `createNextMonth`/`createMonthsBatch`); `categories`
ganhou `totalsForYear` (era `getCategoryTotalsForYear`, decisão 9). `appSettings` manteve
`getAppSetting`/`setAppSetting`/`deleteAppSetting` como o ticket pediu.

Verbos novos para o NULL de referência (decisão 7): `repos.expenses.clearCategory` +
`repos.expenses.clearBankAccount`, `repos.incomes.clearBankAccount`,
`repos.defaultExpenses.clearCategory` — `UPDATE … SET <col> = NULL WHERE <col> = ?`, sem
transação própria. Nascem sem call site: `deleteCategory`/`deleteBankAccount` seguem com o
`db.transaction` interno e o NULL inline até o service compor no ticket 05.

`registerIpc.ts` traduz `null` → `AppError(404)` provisoriamente nos pontos que hoje lançavam
(`monthsGet`, `*Update`, `*Delete`, `expensesPay`/`Unpay`, `incomesReceive`/`Unreceive`),
preservando mensagem e status. `expensesCreate`/`incomesCreate` continuam com o
`AppError(404, 'Mês não encontrado')` dentro do repositório — é guarda de integridade, não o
finder da entidade, e só migra para o service no ticket 05.

Backup: `importData(db, data)` foi extraído de `importFromZipFile` (só o corpo da transação
`pragma OFF` → apaga+reescreve 7 tabelas → `pragma ON`), com `type BackupData` local para as
linhas cruas já normalizadas. `importFromZipFile` mantém unzip + parse + tolerância a chaves
legadas e chama `importData`. `makeRepositories` embrulha em `importBackup` (sem call site
real — `backupHandlers` ainda chama `importFromZipFile` direto; religa no ticket 05).
`getExportData`/`exportToZipFile` intocados.

`transaction()` nasceu sem call site real, como o `git-dlog`. Os ~11 `db.transaction` seguem
dentro dos repositórios (`createMonthWithDefaults`, `createBatch`, `pay`/`unpay`,
`receive`/`unreceive`, os `create` de padrão, os `delete` de conta/categoria, `runSetup`) —
cada um vira composição autorada pelo service no ticket 05.

`themeMode.ts` (gateway) e os helpers de módulo do `monthsRepository`
(`ensureCurrentMonthExists`, `createMonthWithDefaults`, `findMonthByYearMonth`) seguem lendo
as funções livres `getAppSetting`/`setAppSetting` — por isso `appSettingsRepository.ts`
exporta as três funções livres **e** a fábrica. `setupRepository.runSetup` e `index.ts` não
mudaram (religam no ticket 05, decisão 5).

### Divergências registradas, não resolvidas aqui

- **`throw` restante nos repositórios.** A Verificação pede "nenhum `throw` restante"; li isso
  como escopo dos sete `getXRow` de "não encontrado" (todos convertidos), seguindo o
  precedente do ticket 03 do `meu-negocio-app`, que manteve os `AppError` de regra. Seguem
  lançando, por "Nenhuma regra migra": `debitBankAccount` (saldo / conta ausente no débito),
  `months.createNext` (`AppError(400)` de rollover), `expenses.create`/`incomes.create`
  (guarda de mês), `importFromZipFile` (formato inválido). Migram no ticket 05.
- **`BackupData` local, não `@shared`.** O `parseBackupData` com tolerância completa a
  formatos legados e o `exportData(repos)` continuam sendo trabalho do ticket 05 (decisão 12);
  aqui só saiu o mínimo — `importData(db, data)` + tipo local — que o skeleton do
  `importBackup` exige.
- **`months` não tem `create` nem `update` planos** (só `findById`/`list`/`delete` do
  contrato, mais `createNext`/`createBatch`). O app nunca teve edição de mês nem um `create`
  sem rollover; mesma lacuna que o ticket 05 do `git-dlog` registrou para o `update` do
  `scanPathsRepository`. `getCategoryTotalsForYear` virou `categories.totalsForYear` — o
  prefixo `Category` era redundante no método de `repos.categories` (decisão 9 pede o SQL no
  repositório, não um nome específico).
- **`create` ainda tem um `throw new Error(...)` de caminho impossível** (linha some entre o
  `INSERT` e o `SELECT` de releitura), idêntico ao `ordersRepository` do `meu-negocio-app`. Os
  caminhos de mutação (`update`/`pay`/`unpay`/`receive`/`unreceive`) devolvem `findById(id)`
  direto — `Entity | null`, sem lançar no caminho feliz.

### Verificação

`npm run typecheck` (4 apps) 0 erros. `npm run lint` 0 erros (2 warnings pré-existentes em
`OrdersContext.tsx`/`ProductsContext.tsx` do `meu-negocio-app`, não tocados). `npm run test`
187 passando (21 arquivos). `npx electron-vite build` do `meu-dinheiro-app`: main, preload e
renderer compilam e resolvem. Sem teste novo (ADR-0002; `channels.test.ts` já existia).
