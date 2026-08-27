Status: aberto
Blocked by: 04

# Meu Dinheiro: camada de serviço

A regra de negócio sai dos repositórios e do `registerIpc.ts` e passa a morar em `services/` —
mesma forma dos tickets 08 do `git-dlog` e 05 do `meu-negocio-app`. Cada service é uma fábrica
recebendo `Repositories` e os gateways de que precisa; **nenhuma importa `better-sqlite3` nem
`electron`**. É aqui que `repos.transaction()` ganha os call sites reais.

## Services

### `monthsService`
- `create(year, month)` — `AppError(400)` se já existe; `repos.transaction` chamando o helper
  privado abaixo.
- `createBatch(fromY, fromM, toY, toM)` — loop de competência com rollover Dez→Jan, `≤ 60`
  garantido pelo schema (ticket 06); um `repos.transaction` só, chamando o helper por mês,
  acumulando `{ created, errors }` (mês existente vai para `errors`, não falha o lote).
- `createNext()` — lê o último mês, `AppError(400)` se não há nenhum ("Cadastre o primeiro nas
  Configurações"), calcula o seguinte, delega a `create`.
- `ensureCurrentMonth()` — idempotência por competência via `repos.appSettings`
  (`LAST_CURRENT_MONTH_KEY`): devolve `null` se a competência de hoje já foi tratada ou o mês
  já existe; senão cria e devolve. **Chamada pelo `index.ts` no boot e no focus** (ver
  Bootstrap).
- `list()` — o agregado SQL de Realizado/Previsto por mês fica no `repos.months.list()`; o
  service repassa.
- `getDetail(id)` — `repos.months.findById` → `null` vira `AppError(404, 'Mês não encontrado')`.
- `delete(id)` — `null` vira `AppError(404)`; após apagar, marca a competência excluída via
  `repos.appSettings` para o boot não recriar o mês apagado de propósito.

**Helper privado `createMonthWithDefaults(repos, year, month)`** — insere o mês e a cópia
("fotografia") de cada despesa/entrada padrão vigente, com `formatDueDate` de `domain/`. **Não
abre `repos.transaction`** — quem abre é `create`, `createBatch` e `setupService`, uma vez
cada. É o que evita transação aninhada (risco registrado na spec).

### `expensesService`
- CRUD; `create`/`update` conferem que o mês existe (`AppError(404)`).
- `pay(id, { paidAt, bankAccountId, notes, receipt? })` — **confere o saldo da conta antes de
  gravar o comprovante** (ou grava o arquivo só após o commit); depois
  `repos.transaction(() => { debita a conta via bankAccountsService/repos.bankAccounts; marca
  paga com o filename })`. Saldo insuficiente → `AppError(400)`, sem arquivo órfão, sem estado
  meio-pago.
- `unpay(id)` — `repos.transaction`: credita a conta de volta e apaga o comprovante.
- `openReceipt(filename)` — via `receipts` gateway (`shell.openPath`).

### `incomesService`
- CRUD; `receive(id, …)` / `unreceive(id)` em `repos.transaction` (crédito/débito de conta).
  `unreceive` **preserva o `bankAccountId`** — ali a conta descreve para onde a entrada
  costuma cair, é a sugestão do próximo recebimento.

### `defaultExpensesService` / `defaultIncomesService`
- `create()` — `repos.transaction`: insere o padrão e a cascata (uma cópia) para dentro de
  todo mês já existente.
- `update()` / `delete()` — sem propagação: os meses já criados são fotografias.

### `bankAccountsService`
- CRUD; `delete(id)` — `repos.transaction`: `repos.expenses.clearBankAccount(id)` +
  `repos.incomes.clearBankAccount(id)`, depois `repos.bankAccounts.delete(id)`. Excluir não
  desfaz pagamentos.
- `debit(id, amount)` / `credit(id, amount)` — a regra de saldo (`AppError(400)` se
  insuficiente) mora aqui; `expensesService` e `incomesService` chamam por aqui, quebrando o
  acoplamento `expenses`/`incomes` ← `bankAccounts`.

### `categoriesService`
- CRUD; `delete(id)` — `repos.transaction`: `repos.expenses.clearCategory(id)` +
  `repos.defaultExpenses.clearCategory(id)`, depois `repos.categories.delete(id)`. As despesas
  ficam "sem categoria", nunca somem.

### `setupService`
- `run(initialYear, initialMonth)` — `AppError(400)` se já há meses; um `repos.transaction`,
  loop até a competência corrente pelo helper de `monthsService`.

### `backupService`
- Depende de `monthsService`, do gateway de ZIP/fs e dos diálogos.
- `export()` — diálogo save → `repos` (linhas cruas via `exportData`) → gateway monta o `.zip`
  (`data.json` + `uploads/`). Devolve `ExportResult` (união de literais, atravessa por
  atribuição).
- `import()` — diálogo open → gateway extrai o ZIP no diretório temporário → `parseBackupData`
  (em `infra/database`, com a tolerância a backups legados) → `repos.importBackup(data)` →
  gateway copia `uploads/` → `repos.appSettings.deleteAppSetting(LAST_CURRENT_MONTH_KEY)` →
  `monthsService.ensureCurrentMonth()`. Cada falha vira variante de `ImportResult`
  (`invalid-format` etc.).

### `settingsService`
- Tema em runtime pelas quatro camadas: `domain/theme.ts` (`resolveThemeMode`) +
  `infra/gateways/system/themeMode.ts` (`nativeTheme`, `setBackgroundColor`). Ler e gravar
  `THEME_MODE_KEY` via `repos.appSettings`.

### `reportsService`
- `categoryTotalsForYear(year)` — sobre `repos.categories` (o SQL `GROUP BY categoria` é
  método do `categoriesRepository`); mapeia para `CategoryTotalEntity[]`.

## Bootstrap

`registerIpcHandlers(db)` **passa a retornar a composição** (ou `{ months }` no mínimo).
`index.ts`:

- boot: `const services = registerIpcHandlers(db)` e então
  `services.months.ensureCurrentMonth()` — antes era `ensureCurrentMonthExists(db)` chamado
  *antes* de registrar; agora é depois, ainda antes de `createWindow`.
- `app.on('browser-window-focus', () => { if (services.months.ensureCurrentMonth()) notifyDataChanged(); })`
  — a assinatura fica no `index.ts` (ciclo de vida), o `notifyDataChanged` vem de
  `controllers/`.
- tema no boot: `index.ts` constrói `makeAppSettingsRepository(db)` **direto** (não um segundo
  `makeRepositories`), lê `THEME_MODE_KEY`, passa por `resolveThemeMode` de `domain/theme.ts`,
  aplica pelo gateway antes de `createWindow`.

Comentário apontado em `index.ts` e em `registerIpc.ts` explicando o valor de retorno — é
instância do carve-out do ADR-0002, não um princípio novo.

## O que NÃO entra aqui

- Controllers, `parseOrThrow`, `xToResponse`, `handle` estreitado para `IpcChannel` — ticket
  06. `registerIpc.ts` continua fazendo as vezes de controller (validação inline, saída como
  entidade).
- Teste novo — adiado (ADR-0002).

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`, `npx electron-vite build` no app.
Nenhum service importa `better-sqlite3`/`electron`. `npm run dev:dinheiro`: pagar com saldo
insuficiente não deixa comprovante no disco nem despesa meio-paga; criar mês em lote pula os
existentes e reporta; excluir o mês corrente não o recria no boot seguinte; importar backup
recarrega as telas e garante o mês corrente. `/code-review` (Standards + Spec em paralelo) sem
achados abertos.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisões 5, 6, 7, 8, 9, 10, 12, 13, 14).
