Status: resolvido
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

### 2026-08-27 — implementado

Onze services novos em `services/` — cada um fábrica `makeXService(repos, …gateways)`, sem
classe. Nenhum importa `better-sqlite3` nem `electron` (grep limpo; imports de gateway são
todos `import type`). Todo `db.transaction` que morava num repositório virou
`repos.transaction(fn)` autorado no service; os repositórios terminam com **zero**
`db.transaction`.

**`monthsService`.** `create` / `createNext` / `createBatch` / `ensureCurrentMonth` /
`getDetail` / `list` / `delete` conforme o ticket. `LAST_CURRENT_MONTH_KEY`, `currentCompetency`
e `competencyKey` moram aqui como módulo (o `backupService` importa a chave). Helper
**exportado** `createMonthWithDefaults(repos, year, month)` — insere o Mês (`repos.months.create`,
verbo novo, só o `INSERT`), a cópia de cada Despesa/Entrada padrão via `repos.expenses.create`
/`repos.incomes.create`, e a marca de Competência; **não abre `repos.transaction`**. Quem abre,
uma vez cada: `create`, `createBatch`, `ensureCurrentMonth`, `setupService.run` — só verbos
planos lá dentro, sem aninhamento. `export` (não `private`) é a única forma de o `setupService`
reusar o helper (decisão 8); registrado como desvio consciente.

**Verbos novos de repositório** (extensão do contrato do ticket 03, para o service compor):
`months.create` / `months.findByCompetency` / `months.latest` / `months.exists` /
`months.listAll`; `expenses.listAll` / `incomes.listAll` (backup); `bankAccounts.adjustBalance`
(o `UPDATE` de saldo, sem a regra). `months.exists` é guarda de integridade barata para
`expenses/incomesService.create` (o 404 de "Mês não encontrado" que morava no repositório).

**`expensesService.pay`** confere o saldo (`bankAccounts.assertCanDebit`) **antes** de gravar o
comprovante, e só então abre a transação (débito + marca paga). Corrige o comprovante órfão
(decisão 14c). `unpay` credita de volta e apaga o comprovante após o commit.
`bankAccountsService.debit`/`credit` substituem `debit/creditBankAccount` — `credit` não confere
existência (paridade com o comportamento antigo).

**`backupService`** depende do `monthsService` (service→service). `exportData(repos)` +
`parseBackupData` foram para `infra/database/repositories/backupRepository.ts` (precedente
`meu-negocio-app`, com zod); o `.zip`/diretório temporário/cópia de `uploads/` foram para
`infra/gateways/backupArchive.ts` (topo de `gateways/`, como `receipts.ts`); os diálogos para
`infra/gateways/system/dialogs.ts`. `data:openFolder` foi para `backupService.openDataFolder`
(precedente `meu-negocio-app`) com um `ShellGateway` novo. Pós-import:
`deleteAppSetting(LAST_CURRENT_MONTH_KEY)` + `monthsService.ensureCurrentMonth()`.

**Bootstrap.** `registerIpcHandlers(db)` devolve `{ months: monthsService }`; `index.ts` chama
`services.months.ensureCurrentMonth()` **depois** de registrar (ordem invertida de
"ensure→register" para "register→ensure") e no `browser-window-focus`. O tema no boot: `index.ts`
monta `makeAppSettingsRepository(db)` direto, `resolveThemeMode`, `themeMode.apply`. O gateway
`themeMode.ts` virou objeto (`apply`/`currentMode`/`windowBackgroundFor`/`systemPrefersDark`),
espelhando `meu-negocio-app`; `resolveInitialThemeMode`/`getThemeMode`/`applyThemeMode`/
`themeBackground` saíram. Comentário de carve-out do ADR-0002 nos dois arquivos.

`setupRepository.ts` apagado (`runSetup` → `setupService.run`). `registerIpc.ts` segue como
controller provisório (validação inline com zod, saída como entidade) — só que agora fala com
services, e o `null`→`AppError(404)` que ele traduzia sumiu (o service decide o 404).

### Ajustes da revisão

- `gateways/backup/archive.ts` → `gateways/backupArchive.ts` (achado Standards: subpasta de um
  arquivo só; o topo de `gateways/` é o que este app usa, decisão 10).
- `nextCompetency(year, month)` extraído em `monthsService.ts` — dedup do rollover Dez→Jan que
  se repetia em `createNext`, `createBatch` e `setupService.run` (achado Standards: Duplicated
  Code).
- `incomesService.receive` passou a receber `ReceiveIncomeInput` (objeto), como
  `expensesService.pay` recebe `PayExpenseInput` (achado Standards: Data Clumps / inconsistência).

### Divergências registradas, não resolvidas aqui

- **`expensesService.update` / `incomesService.update` não conferem o Mês.** O ticket diz
  "`create`/`update` conferem que o mês existe"; `update` não recebe `monthId` e não move o
  item entre Meses, então o 404 dele é "item não encontrado" (idêntico ao `registerIpc.ts` de
  antes). Lido como imprecisão do ticket.
- **`settingsService.getThemeMode()` lê o gateway, não `repos.appSettings`.** O ticket diz "ler
  e gravar `THEME_MODE_KEY` via `repos.appSettings`"; só `setThemeMode` grava lá. Ler o banco a
  cada `theme:get` seria errado — depois do boot o `nativeTheme` é a fonte (o comentário do
  gateway explica). Mesmo desenho do `settingsService` do `meu-negocio-app` e do carve-out
  registrado no ticket 04.
- **`exportData` re-mapeia por entidade e estreita as colunas do `data.json`** (ex.: `categories`
  só `{id,name,color}`; `default_expenses`/`default_incomes` perdem `id`/`created_at`) — antes
  era `SELECT *`. A decisão 12 manda `exportData(repos)` e `repos` devolve entidades, então
  algum re-mapeamento é inevitável; o estreitamento é seguro (o `importData` nunca lia essas
  colunas, o `parseBackupData` tolera a ausência, o round-trip continua íntegro).
- **"Competência" ainda é `{ year, month }` solto**, não um `type` de `domain/`. Primitive
  Obsession / Data Clumps apontado na revisão (Standards); o ticket 04 (entidades) fechou sem
  criar o tipo e este ticket é "services". Candidato ao ticket 07 (limpezas).
- **Duplicação da cascata padrão→Mês** (`createMonthWithDefaults` × `defaultExpenses/
  IncomesService.create`, 4 literais de linha) — apontado como Duplicated Code (judgement). As
  duas pontas partem de tipos diferentes (`DefaultXEntity` com campos não-opcionais vs. input de
  `create` com campos opcionais), então extrair normalizaria os dois lados sem encurtar. Deixado.
- **Tipagem de input inconsistente**: `defaultExpenses/IncomesService` têm `CreateXInput`/
  `UpdateXInput` nomeados; `expenses`/`incomes`/`categories`/`bankAccounts` inlinam a mesma
  forma. O ticket 06 (Request/Response) tipa a borda; deixado como está.
- **`list()` vs `listAll()`** nos repositórios de months/expenses/incomes: o nome não diz
  "com agregados" vs "linhas planas" (comentário carrega). `list` é o verbo do contrato
  (README §2.2) e não pode virar `listWithTotals`; `listAll` contrasta com `listForMonth`.

### Verificação

`npm run typecheck` (4 apps) exit 0. `npm run lint` 0 erros (2 warnings pré-existentes de
`react-hooks/exhaustive-deps` em `OrdersContext.tsx`/`ProductsContext.tsx` do `meu-negocio-app`,
não tocados). `npm run test` 187 passando (21 arquivos). `npx electron-vite build` do
`meu-dinheiro-app`: main (51 módulos), preload e renderer compilam e resolvem. Sem teste novo
(ADR-0002; `channels.test.ts` já existia). Grep confirma: nenhum service importa
`better-sqlite3`/`electron`. `/code-review` (Standards + Spec, sub-agents paralelos): 0
violações duras nos dois eixos; achados de julgamento tratados acima (3 aplicados, o resto
registrado). Smoke de GUI (`npm run dev:dinheiro`) não rodado nesta sessão.
