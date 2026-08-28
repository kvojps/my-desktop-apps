Status: resolvido
Blocked by: 06

# Meu Dinheiro: limpezas

Fecha a migração — mesma função dos tickets 10 do `git-dlog` e 07 do `meu-negocio-app`. O
conteúdo real só é conhecido depois de 01–06; o que segue é a lista provável, a confirmar
contra os `## Comments` dos tickets anteriores.

## Provável

- **Remover o global `getDb()`** de `infra/database/connection.ts` — confirmar zero call sites
  antes. A conexão deve viver só no local do `index.ts` que a passa a `makeRepositories(db)` e
  ao `appSettingsRepository` do bootstrap.
- **Decidir o destino de `getDbPath()`** — hoje só o diálogo de erro fatal do `index.ts` usa.
  Se for o único, ou vira parâmetro passado do `index.ts`, ou fica documentado como o carve-out
  que é.
- **Manter `getUploadsDir()`** como helper de caminho puro (deriva um path, não entrega a
  conexão) — passado pelo `registerIpc` aos gateways de comprovante e backup.
- **`README.md` §2.2** — mover `meu-dinheiro-app` de "na fila" para "convertido" na linha de
  apps migrados. Sobra só `meu-movel-planejado`.
- **Auditar `useDataChanged`** no renderer — o app já está na versão B do `handle`; provável
  nada a fazer, confirmar.
- **Opcional: retroportar `AppError.code` + `utils/errors/errorReason.ts`** do `git-dlog` /
  `meu-movel-planejado`, se o alinhamento entre apps valer o diff. Não obrigatório — o
  `meu-negocio-app` não retroportou.
- **Absorver as divergências registradas** nas subseções "Divergências registradas" dos
  tickets 03–06.

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`, `npx electron-vite build`,
`npm run format`. Cada remoção precedida da confirmação de zero call sites.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisão 13). Commit único
(`[refac]: …` ou `[docs]: …` conforme o peso do que sobrar) é aceitável, como no
`meu-negocio-app`.

### 2026-08-28 — implementado

Varrido o que os tickets 01–06 registraram. Quase toda a dívida que a lista
"Provável" antecipava já tinha sido absorvida pelos tickets 03–06 — o que sobrou
para cá foi código morto em `connection.ts` e a linha do `README.md`. Commit
único `[refac]:`.

**Código morto: `getDb` e `getDbPath` saíram de `infra/database/connection.ts`.**
Zero call sites em `apps/meu-dinheiro-app/src` antes de remover (o único match de
`getDb` restante é o `dist/` versionado, artefato de build). `getDb` nunca teve
uso desde que o `db` passou a descer por parâmetro do `index.ts`. `getDbPath`
**também** era morto — e não só "o único call site é o diálogo fatal", como a
lista "Provável" supôs: `git grep` na árvore pré-migração (`a911537^`) e no
commit que o introduziu (`ea0f728`) confirma **nenhum** call site em momento
nenhum. O `reportFatalDbError` do `index.ts` usa `app.getPath('userData')`
direto, não o getter. O doc-comment "exibido na tela de Configurações" era
aspiracional — não há canal `app:getInfo` nem tela que mostre o caminho neste
app (ao contrário do que o ticket 10 do `git-dlog` registrou; ali a suposição
de que `meu-dinheiro-app` usava `getDbPath` estava errada). Tirar os dois
deixou `connection.ts` **sem estado de módulo**: os `let db` / `let dbFilePath`
de arquivo só existiam para alimentá-los. `initDb` agora abre com `const`
locais e devolve; a conexão só vive na variável do `index.ts` que a passa a
`makeRepositories(db)` e ao `makeAppSettingsRepository(db)` do bootstrap. Mesmo
resultado do ticket 10 do `git-dlog`.

**`getUploadsDir` mantido** como helper de caminho puro em `connection.ts`
(decisão 13) — deriva um path, não abre conexão. Ganhou doc-comment apontando a
decisão; `registerIpc` já o passa fechado aos gateways de comprovante e de
backup (`registerIpc.ts:49`).

**`README.md` §2.2.** A prosa da fila passou a `git-dlog`, `meu-negocio-app` e
`meu-dinheiro-app` convertidos, só `meu-movel-planejado` na fila. `ADR-0002` não
mexido — lá o texto (linha 119) enuncia a ordem planejada como decisão de
época, não um done-state, e segue correto; mesma escolha do ticket 07 do
`meu-negocio-app`.

**`useDataChanged` no renderer — auditado, nada a fazer.** Os três contexts que
guardam dado assinam (`BankAccountsContext`, `CategoriesContext`,
`MonthsContext`, todos `useDataChanged(reload)`), mais os hooks
`useCategoryTotals`, `useDefaultExpenses`, `useDefaultIncomes` e `useMonth`.
`SnackbarContext` (UI) e `ThemeModeProvider` (`theme:*` é read-only) estão fora
da regra de propósito. O ticket 01 já tinha feito por inteiro — sem a pendência
que o ticket 03 do `git-dlog` deixou para o 10.

**`AppError.code` + `errorReason.ts` — não retroportado.** O ticket marca como
opcional e não obrigatório; o `meu-negocio-app` (precedente direto — "como no
`meu-negocio-app`") não retroportou, e o `toIpcError.ts` dos dois apps é
idêntico byte a byte. Alinhar `meu-dinheiro` + `meu-negocio` ao par
`git-dlog`/`meu-movel` é trabalho de uma leva própria de alinhamento entre
apps, não de uma limpeza de migração. Fica anotado.

### Divergências registradas dos tickets 03–06 — estado ao fechar a leva

- **Ticket 03 — `throw` restante nos repositórios.** Resolvido no ticket 05:
  toda regra (`debitBankAccount`, `months.createNext`, guarda de mês de
  `expenses/incomes.create`, formato de backup) migrou para services. O que
  resta nos sete repositórios de entidade é um `throw new Error('X not found
after insert')` de caminho impossível (linha some entre `INSERT` e `SELECT`),
  idêntico ao `ordersRepository` do `meu-negocio-app` — padrão aceito, não é
  `AppError`, não atravessa o IPC como 4xx.
- **Ticket 03 — `BackupData` local, não `@shared`.** Resolvido no ticket 05:
  `exportData(repos)` + `parseBackupData` (com zod e tolerância a legados) moram
  em `infra/database/repositories/backupRepository.ts`; `backupService` não
  importa `zod` nem nada de `controllers/`. É o item que o ticket 07 do
  `meu-negocio-app` teve de absorver e que aqui já veio pronto do 05.
- **Ticket 03 — `months` sem `create`/`update` planos.** `create` (só o
  `INSERT`) nasceu no ticket 05 para o helper compor. `update` continua sem
  existir: o app nunca teve edição de Mês. Mesma lacuna consciente que o ticket
  05 do `git-dlog` registrou para o `scanPathsRepository`.
- **Ticket 04 — entidade atravessa o IPC sem mapper.** Resolvido no ticket 06:
  `controllers/responses/*.response.ts`, um mapper por nó-objeto.
- **Ticket 04 — `index.ts` declara `ThemeMode` de `@shared`.** Resolvido no
  ticket 05: `index.ts` importa `ThemeModeEntity` de `./domain/theme`; o gateway
  virou objeto (`apply`/`currentMode`/`windowBackgroundFor`/`systemPrefersDark`).
- **Ticket 04 — nomes herdados de `@shared/types/month`**
  (`totalIncomes`/`receivedIncomes` contagem vs `totalIncome`/`receivedIncome`
  dinheiro). Comportamento idêntico exigido pela spec; recriados verbatim no
  `domain/`. Só registro — renomear é mexer no contrato compartilhado.
- **Ticket 05 — `expenses/incomesService.update` não conferem o Mês.** `update`
  não recebe `monthId` nem move o item entre Meses; o 404 dele é "item não
  encontrado", idêntico ao `registerIpc.ts` de antes. Imprecisão do enunciado.
- **Ticket 05 — `settingsService.getThemeMode()` lê o gateway.** Depois do boot
  o `nativeTheme` é a fonte; ler o banco a cada `theme:get` seria errado. Mesmo
  desenho do `meu-negocio-app`.
- **Ticket 05 — `exportData` estreita as colunas do `data.json`.** Seguro: o
  `importData` nunca lia as colunas removidas, o `parseBackupData` tolera a
  ausência, o round-trip continua íntegro.
- **Ticket 05 — "Competência" ainda é `{ year, month }` solto.** Marcado como
  "candidato ao ticket 07". Deixado como está, deliberadamente: seguir o
  precedente do ticket 07 do `meu-negocio-app`, que absorveu só a inversão de
  camada dura e deixou os smells de julgamento (Primitive Obsession / Data
  Clumps) como divergência registrada. O tipo teria call sites em
  `currentCompetency`/`nextCompetency`/`createMonthWithDefaults`/`createBatch` de
  um `monthsService.ts` só — um raio de blast pequeno, um arquivo, sem inversão
  de camada. Não é limpeza de migração; é um refactor de domínio que cabe numa
  leva própria (junto de "Competência" virar entidade de `domain/`, se valer).
- **Ticket 05 — duplicação da cascata padrão→Mês.** As duas pontas partem de
  tipos diferentes (`DefaultXEntity` não-opcional vs input de `create`
  opcional); extrair normalizaria os dois lados sem encurtar. Deixado.
- **Ticket 05 — tipagem de input inconsistente** (`CreateXInput` nomeado em
  `defaultExpenses/Incomes`, inline nos demais). A borda é tipada pelos schemas
  do ticket 06; nomear o input de service é cerimônia sem ganho. Deixado.
- **Ticket 05 — `list()` vs `listAll()`.** `list` é o verbo do contrato (README
  §2.2) e não pode virar `listWithTotals`; `listAll` contrasta com
  `listForMonth`. Comentário carrega a distinção. Deixado.
- **Ticket 06 — payload de `expenses:pay` / tipo anônimo inline / `incomes:
receive` com 4 args posicionais / `reportsController` com `parseId` para ano /
  `delete` ×7.** Todos presos ao contrato de IPC de `@shared/ipc/api` ou ao
  layout "nenhuma camada pulável". Mexer neles é mexer em preload + renderer +
  contrato compartilhado — fora do escopo "camadas do main". Deixados, cada um
  registrado no ticket 06.

### Verificação

`npm run typecheck` (4 apps) exit 0. `npm run lint` 0 erros (os 2 warnings
pré-existentes de `react-hooks/exhaustive-deps` em
`OrdersContext.tsx`/`ProductsContext.tsx` do `meu-negocio-app`, não tocados).
`npm run test` 187 passando (21 arquivos) — sem teste novo (decisão 16;
`channels.test.ts` já existia). `npx electron-vite build` do `meu-dinheiro-app`:
main, preload e renderer compilam e resolvem (built in 2m 7s). `prettier
--check` nos arquivos tocados: limpo.

`/code-review` (Standards + Spec, sub-agents paralelos, fixed point `HEAD`
43672c8):

- **Spec — 0 achados.** As sete "Prováveis" endereçadas; os cinco passos de
  Verificação conferidos de forma independente. A única divergência do enunciado
  (`getDbPath` tem zero call sites, não "só o diálogo fatal usa") julgada
  defensável — apagar código morto é estritamente melhor que documentar um
  carve-out para algo que ninguém chama, e casa com o precedente do ticket 10 do
  `git-dlog`. Deixar a "Competência solta" como divergência registrada julgada
  consistente com o ticket 07 do `meu-negocio-app` ("candidato", não item
  obrigatório; absorver = resolver **ou** deixar consciente com racional).
- **Standards — 0 violações duras, 1 achado de julgamento aplicado.** O
  doc-comment novo de `getUploadsDir` citava `.scratch/…/decisão 13` — caminho
  transiente que apodrece quando a pasta da feature é limpa. Reescrito para
  ancorar na norma durável (README §2.2 / ADR-0002): o helper não é "getter de
  módulo" porque não alcança o banco. A remoção de `getDb`/`getDbPath` + estado
  de módulo foi registrada pelo Standards como **conformidade** — o arquivo
  violava a própria §2.2 antes. `dist/` versionado ainda contém `getDb`
  (artefato de build, regenera; fora do diff).
