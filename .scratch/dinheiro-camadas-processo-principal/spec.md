Status: aberto

# Camadas do processo principal: Meu Dinheiro

Deriva de uma sessão de `/grill-with-docs` (grilling + domain-modeling) seguida de plan mode.
O `git-dlog` e o `meu-negocio-app` já rodam no padrão de quatro camadas (README §2.2,
ADR-0002/0003) — tickets 01–10 de `.scratch/camadas-processo-principal/` e 01–07 de
`.scratch/negocio-camadas-processo-principal/`, todos resolvidos. O `meu-dinheiro-app` é o
terceiro app da fila e ainda está no arranjo pré-camadas que o ADR-0002 cita nominalmente:
`db/monthsRepository.ts`, 312 linhas de competência, defaults e cascata.

## Problema

| | `git-dlog` | `meu-negocio-app` | `meu-dinheiro-app` |
|---|---|---|---|
| `db.transaction(` nas repositories | 0 | 4, só em `ordersRepository.ts` | ~11, espalhados por 8 repositórios |
| Entidade que difere do response | nenhuma | `stock_applied`, fora de `OrderItem` | nenhuma óbvia |
| Regra de negócio dentro do repositório | não | sim — estoque | sim — competência, defaults, cascata, saldo |
| Versão do `handle` | A → B no ticket 03 | A → B no ticket 01 | **já B** (o ADR-0001 nasceu aqui) |
| Bootstrap invoca operação de negócio | não | não | **sim** — `ensureCurrentMonthExists` no boot e no focus |

Frentes medidas no `src/main` atual:

1. **`db/monthsRepository.ts` (312 linhas)** concentra: `competencyKey`/`currentCompetency`/
   `rememberCurrentCompetency` (marcação de competência), `insertExpensesFromDefaults`/
   `insertIncomesFromDefaults` (cascata de padrões para dentro de um mês novo),
   `createMonthWithDefaults` (`db.transaction`), `ensureCurrentMonthExists` (idempotência por
   competência — roda no boot e no `browser-window-focus`), `listMonths` (agregado SQL de
   Realizado/Previsto por mês), `getMonthWithExpenses` (lança `AppError(404)` de dentro do
   repositório), `createNextMonth` (rollover Dez→Jan, `AppError(400)` para "sem meses" e "mês
   já existe"), `deleteMonth` (marca a competência excluída para o boot não recriar o mês
   apagado de propósito), `createMonthsBatch` (até 60, `db.transaction` aninhada com
   `createMonthWithDefaults`, retorno `{ created, errors }`).
2. **~11 `db.transaction` em repositórios**, quase todos composição multi-tabela genuína:
   `createMonthWithDefaults`, `createMonthsBatch`, `payExpense`/`unpayExpense` (débito/crédito
   de conta + marca paga), `receiveIncome`/`unreceiveIncome`, `createDefaultExpense`/
   `createDefaultIncome` (cascata para todo mês existente), `deleteCategory`/
   `deleteBankAccount` (NULL nas referências, depois DELETE), `runSetup` (backfill de primeira
   execução). Contra 0 do `git-dlog` e 4 do `meu-negocio-app`.
3. **Imports repo→repo**: `monthsRepository` importa de `appSettingsRepository`,
   `expensesRepository` e `incomesRepository`; `setupRepository` importa
   `createMonthWithDefaults` de `monthsRepository`; `expensesRepository`/`incomesRepository`
   importam `debitBankAccount`/`creditBankAccount` de `bankAccountsRepository`;
   `theme/themeMode.ts` importa `getAppSetting` de `appSettingsRepository`.
4. **404 lançado no repositório** em vários `getXRow` (months, expenses, incomes,
   bankAccounts, categories, defaultExpenses, defaultIncomes). O ADR-0002 diz que o
   repositório devolve `null` e o 404 é do service.
5. **Backup é `.zip`** (`data.json` de todas as tabelas + pasta `uploads/` com os
   comprovantes), mais pesado que o JSON puro do `meu-negocio-app`. A orquestração de disco,
   diálogo nativo e pack/unpack está dividida entre `db/backupRepository.ts` e
   `ipc/backupHandlers.ts`.
6. **Sem precedente nos dois apps anteriores**: `index.ts` chama `ensureCurrentMonthExists(db)`
   no boot e dentro de `app.on('browser-window-focus', …)`. O carve-out do bootstrap do
   ADR-0002 cobre ler o tema direto de um repositório — não invocar uma operação de negócio.

## Decisões

Sessão de grilling encadeada com plan mode, 16 decisões — as três últimas são processo, não desenho:

| # | Decisão |
|---|---|
| 1 | Spec em diretório-irmão próprio (este), não continuação numerada das specs anteriores |
| 2 | **Sem ticket de conformidade do `handle`.** O app já está na versão B: `ipc/handle.ts` já dispara `notifyDataChanged` nas escritas, `ipc/notifyDataChanged.ts` existe, `shared/ipc/channels.ts` já tem `READ_ONLY_CHANNELS` + `shouldNotifyDataChanged` + `channels.test.ts` |
| 3 | 7 tickets: `context-md` → `mover-arquivos` → `unit-of-work` → `entidades` → `services` → `controllers` → `limpezas`. 01 e 02 sem dependência mútua; 03→07 sequenciais |
| 4 | `apps/meu-dinheiro-app/CONTEXT.md` é criado nesta leva (ticket 01). Hoje não existe — e a ausência é o estado normal (`CONTEXT-MAP.md`). A migração é o momento em que o vocabulário vira nome de entidade e de service e não há glossário contra o qual conferir |
| 5 | **Bootstrap invoca service.** `registerIpcHandlers(db)` passa a retornar a composição; `index.ts` chama `services.months.ensureCurrentMonth()` no boot (após registrar) e no handler `browser-window-focus`. Ordem do boot muda de "ensure → register" para "register → ensure", ainda antes de `createWindow`. Sem ADR de app — é instância do carve-out do ADR-0002. Registrado aqui + comentário apontado em `index.ts` e `registerIpc.ts` |
| 6 | Toda `db.transaction` de repositório vira composição `repos.transaction(fn)` autorada pelo service. Os repositórios terminam com zero `db.transaction`, como o `git-dlog` (`migrations.ts` mantém a sua — plumbing). Diferente do `meu-negocio-app`, aqui nenhuma é "atomicidade de um verbo só" |
| 7 | `deleteCategory`/`deleteBankAccount` ganham verbos pequenos de repo para o NULL das referências (`repos.expenses.clearCategory(id)` etc.); a transação passa a ser composta no service |
| 8 | `monthsService` ganha um helper privado "cria um mês com seus padrões", reusado por `create`, `createBatch` e `setupService`, para que batch e setup não aninhem `repos.transaction` |
| 9 | `reports:categoryTotalsForYear` ganha `reportsService` + `reportsController` próprios (um método cada). O SQL `GROUP BY categoria` fica como método do `categoriesRepository` |
| 10 | Comprovantes ficam dentro do domínio de despesas — sem `receiptsService`/`receiptsController`. `expensesService.pay()` orquestra o gateway; `expensesService.openReceipt(filename)` cobre `receipts:open`, tratado pelo `expensesController`. Gateway em `infra/gateways/receipts.ts` (topo de `gateways/`, não sob `system/`) |
| 11 | Entidades num ticket só (como `meu-negocio-app`), divisível se inchar. `MonthDetailEntity` (Month + `expenses[]` + `incomes[]`) com um mapper por nó-objeto |
| 12 | Backup: `infra/database` fica com `exportData(repos)` + `importData(db, data)` + `parseBackupData` (inclui tolerância a backups legados); `importBackup` entra em `makeRepositories`. `infra/gateways/` fica com ZIP, diretório temporário, cópia de `uploads/`, diálogos. `services/backupService.ts` orquestra, traduz `ExportResult`/`ImportResult`, e no pós-import chama `deleteAppSetting(LAST_CURRENT_MONTH_KEY)` + `monthsService.ensureCurrentMonth()`. `backupService` depende de `monthsService` (service→service, precedente `prsService`→`reposService`) |
| 13 | `getUploadsDir()` sobrevive como helper de caminho puro em `infra/database/connection.ts` — deriva um path, não entrega a conexão. `registerIpc` passa aos gateways de comprovante e backup na composição |
| 14 | Mudanças de comportamento deliberadas (o resto é refactor puro): (a) `receipts:open` ganha guarda zod de filename — relativo/malformado passa a ser rejeitado; (b) 404 migra de repo para service (visível ao renderer, idêntico); (c) bug pré-existente corrigido no ticket 05: `expenses:pay` grava o comprovante antes da transação — `expensesService.pay()` passa a conferir o saldo antes de gravar |
| 15 | Commits em inglês, com os prefixos entre colchetes do repo. Ritmo de dois commits por ticket do `meu-negocio-app` (`[refac]:` do código, depois `[docs]: closes ticket NN …`). Ticket 02 (mecânico) e 07 (limpeza) podem ser commit único. `/code-review` (Standards + Spec) após 05 e 06 |
| 16 | Teste adiado (ADR-0002). Nenhum ticket com permissão de teste — o `channels.test.ts`, exceção nos dois runs anteriores, já existe aqui |

## Ordem

1. CONTEXT.md
2. Mover arquivos
3. Unit of work
4. Entidades
5. Services
6. Controllers
7. Limpezas

01 e 02 não têm dependência entre si; executam na ordem do número. 03→04→05→06→07 são
sequenciais, cada um bloqueia o próximo — mesma ordem de dependência do `git-dlog` e do
`meu-negocio-app` (estrutura de pastas antes do unit of work, entidades antes de services,
services antes de controllers).

## Riscos

- **`registerIpcHandlers(db)` passa a retornar um valor** e `index.ts` passa a chamar um
  service — desvio dos dois apps anteriores. Documentado na decisão 5 e em comentário nos dois
  arquivos; um leitor futuro de `index.ts` precisa entender por quê sem abrir a spec.
- **Reordenação do boot** (register → ensure-current-month). O mês corrente passa a ser criado
  um pouco depois no boot, ainda antes de `createWindow` — verificar que nada no caminho
  depende da ordem antiga.
- **Transação aninhada em batch/setup.** `createMonthsBatch` e `runSetup` hoje aninham
  `db.transaction`. O helper privado compartilhado de `monthsService` (decisão 8) precisa ser
  "cria um mês com seus padrões" *sem* abrir `repos.transaction` — quem abre é `create`,
  `createBatch` e `setupService`, uma vez cada.
- **Superfície de repo ampliada** pelos verbos de NULL-de-referência (decisão 7) — quatro
  métodos novos (`clearCategory`/`clearBankAccount` em expenses/incomes/defaultExpenses).
- **`registerIpc.ts` tende a crescer** — ~11 domínios (months, expenses, incomes,
  defaultExpenses, defaultIncomes, bankAccounts, categories, reports, backup, settings, setup)
  contra os 4 do `meu-negocio-app`. Vigiar tamanho no ticket 06; se doer, o que sai é a
  composição, não o registro (mesma pendência que o `meu-negocio-app` registrou).
- **Comprovante órfão.** `expenses:pay` grava o arquivo antes da transação; um rollback por
  saldo insuficiente deixa lixo no disco. Corrigido no ticket 05 (confere saldo antes de
  gravar, ou grava após o commit) — está no caminho que a migração reescreve de qualquer
  forma.

## Fora de escopo

- `meu-movel-planejado` — continua para depois, último da fila.
- O código migrado em si — é trabalho dos tickets 01–07, um por vez.
- Qualquer mudança de UI/renderer além de manter a cadeia de invalidação que já funciona
  (o app já está na versão B do `handle`).

## Comments

Spec e tickets gerados a partir de uma sessão de `/grill-with-docs` (grilling + domain-modeling,
16 decisões) seguida de plan mode. O plano completo está em
`C:\Users\josef\.claude\plans\ajude-me-a-planejar-a-calm-pearl.md`.
