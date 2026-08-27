Status: resolvido
Blocked by: 04

# Meu Negócio: services

Espelha `.scratch/camadas-processo-principal/issues/08-dlog-services.md`. É onde a regra de
negócio que hoje mora nos repositórios se muda de vez, e onde `setOrderStatus` prova o
`transaction()` do ticket 3.

## `ordersService.ts`

Recebe `repos` (nunca importa `better-sqlite3`). Absorve:

- `findStockShortages`, `deductStockForOrder`, `restoreStockForOrder` — hoje em
  `ordersRepository.ts`, misturando SQL e regra. O SQL fica no repositório (via os verbos do
  ticket 3); a regra — quais produtos faltam, quanto baixar, quanto estornar — vem para cá.
- O clamp em zero de `adjustProductStock` (hoje em `productsRepository.ts`) — o service chama
  `repos.products.findById`/`update` diretamente, sem importar `productsRepository`, resolvendo
  o acoplamento entre repositórios que o ticket 11 aponta.
- `setOrderStatus` inteiro vira uma função do service que monta uma closure e a passa a
  `repos.transaction(fn)`: checa a transição de status, consulta falta de estoque, lança
  `AppError(409)` se faltar, baixa ou estorna, grava o novo status — tudo dentro da mesma
  transação, só que autorada aqui, não no repositório.
- `deleteOrder`: se `repos.orders.findById` devolver `null`, lança `AppError(404)` (mudança de
  comportamento — hoje silencia). Se a venda estava `completed`, estorna o estoque antes de
  apagar, dentro da mesma transação.
- `updateOrder`, `setOrderPaymentAmount`: 404 quando o id não existe — comportamento que já
  existe, só muda de camada.

## `productsService.ts`

CRUD simples. `deleteProduct` passa a lançar `AppError(404)` quando o id não existe — mesma
mudança de comportamento de `deleteOrder`.

## `settingsService.ts`

`CompanySettings` (`getSettings`/`updateSettings`) e o que sobrar de tema (`THEME_MODE_KEY`,
`applyThemeMode`, `getThemeMode`) — a parte de regra que o ticket 2 deixou de fora ao mover só a
moldura nativa para o gateway.

## `backupService.ts`

Orquestra `exportData`/`importData` (as funções já existem, hoje em `db/backupRepository.ts`, e
continuam sem regra de negócio significativa) chamando os repositórios e os gateways do ticket
4. Decide o formato de erro de import inválido (`canceled` / `read-failed` / `invalid-json` /
`invalid-format`) — hoje isso já está certo em `backupHandlers.ts`, só muda de camada.

## Verificação

`npm run typecheck`, `npm run lint`, `npm run test`. Nenhum service importa `better-sqlite3`
nem `electron`. `setOrderStatus` continua atômico: forçar uma falha de estoque no meio de uma
conclusão de pedido não deve deixar produto com baixa parcial.

## Comments

### 2026-08-27 — implementado

Quatro services em `services/`, todos fábricas recebendo `Repositories` e os gateways de que
precisam. Nenhum importa `better-sqlite3` nem `electron` (verificado por grep, incluindo
transitivo: `backupService` só toca `import type` de gateway).

`ordersService.ts` absorveu a regra que morava em `ordersRepository.ts`:
`findStockShortages`/`deductStockForOrder`/`restoreStockForOrder` viraram `stockShortages`/
`deductStock`/`restoreStock` (closures sobre `repos`, lendo `order.items` da entidade em vez de
reconsultar), e o clamp em zero de `adjustProductStock` virou `moveProductStock` — o service
chama `repos.products.findById`/`update` direto, cortando o `ordersRepository` →
`productsRepository` (problema 3 da spec). `setStatus` e `delete` inteiros viraram closures
autoradas no service e passadas a `repos.transaction(fn)` — são os primeiros call sites reais de
`transaction()` no monorepo. `update` levou junto o `AppError(409)` de venda concluída/cancelada
(o repositório tinha comentário marcando ticket 5). O 409 de falta de estoque continua sendo
lançado de dentro da transação: `throw` faz rollback, então forçar a falta no meio de uma
conclusão não deixa baixa parcial.

`ordersRepository.ts` ficou só com verbos: `setStatus`/`delete` agora gravam uma coluna e
devolvem `OrderEntity | null`; ganhou `setItemStockApplied(itemId, n)` para o service registrar
a baixa por item sem escrever SQL. `create`/`update` mantêm o `db.transaction` interno — é
atomicidade de um verbo, não composição de regra. `productsRepository.ts` perdeu os exports
soltos `getProductById`/`adjustProductStock`/`StockAdjustment` (ninguém mais os chama);
`findById` foi re-inlinado.

`productsService.ts` é CRUD; `delete` passou a lançar `AppError(404)`.

`settingsService.ts`: `getSettings`/`updateSettings` sobre `repos.settings`, e o tema —
`getThemeMode()` devolve `themeMode.currentMode()`, `saveThemeMode(mode)` persiste em
`app_settings` e manda o gateway aplicar.

`backupService.ts` orquestra diálogo → disco → parse → validação → `repos.importBackup`, e decide
o formato de erro (`canceled`/`read-failed`/`invalid-json`/`invalid-format`). `backupHandlers.ts`
virou três linhas, cada uma passando a janela opaca (`windowFor`) ao service.

`registerIpc.ts` compõe os quatro services e os handlers viraram uma linha cada — o
`AppError(404)` que ele traduzia do `null` do repositório saiu (agora é o service que lança).

Verificação: `typecheck` (4 apps), `lint` (0 erros, os mesmos 2 warnings pré-existentes de
`react-hooks/exhaustive-deps` no renderer), `test` (187 passando, nenhum novo — adiamento do
ADR-0002, igual aos tickets 03/04) e `electron-vite build` do app (main/preload/renderer).

Pós-`/code-review` (Standards + Spec em paralelo): o literal de `AppError(404)` de pedido,
repetido em `update`/`setStatus`/`setPaymentAmount`, virou o helper `orderNotFound(id)` no
`ordersService`. `setStatus` continua atômico — a revisão confirmou que `requireOrder` é só um
pré-read fora da transação e que qualquer `throw` dentro dela faz rollback do savepoint inteiro,
sem baixa parcial.

### Divergências registradas

- **Split de tema segue o desenho final do `git-dlog`, não a lista literal do ticket.** O ticket
  diz que o `settingsService` absorve "`THEME_MODE_KEY`, `applyThemeMode`, `getThemeMode`". Mas
  `applyThemeMode` **é** Electron (`nativeTheme`, `BrowserWindow`) e o ticket 2 já dizia "só a
  moldura nativa para o gateway" — ele ficou lá, como `themeMode.apply`. A parte pura
  (`resolveThemeMode`, `THEME_MODE_KEY`, `isThemeModeEntity`) nasceu em **`domain/theme.ts`**
  novo — o bootstrap precisa dela e não pode chamar o service (carve-out do ADR-0002), e
  `domain/` é a única pasta que ele alcança sem montar unidade de trabalho. É o mesmo lugar que
  o `git-dlog` deu ao equivalente (`domain/settings.ts`). O ticket 4 não criou esse arquivo
  porque não tocou tema. O service ficou com `getThemeMode`/`saveThemeMode` que **costuram**
  repositório e gateway — que é a "parte de regra" real.
- **`backupService` importa um schema zod de `controllers/schemas/`.** Vai contra o README §2.2
  ("service não conhece zod") e contra a direção normal controller → service — é a inversão de
  camada mais séria deste ticket, e as duas revisões (Standards e Spec) a marcaram como dívida
  ainda aberta na árvore, não resolvida. O ticket é explícito em querer essa lógica no service
  ("Decide o formato de erro de import inválido … só muda de camada"), e o import de backup
  valida um **arquivo que o próprio service lê** — não um argumento de IPC que o controller
  pudesse validar antes, então o fluxo normal "controller valida, service confia" não se
  aplica. O paralelo com o `scanPathsService` do `git-dlog` é **mais fraco do que parece**: lá
  o service trocou o `fs.existsSync` de dentro do schema por uma chamada de **gateway**
  (`fileSystem.isDirectory()`), não passou a importar um schema. Deixado como está para o
  **ticket 6**, que é dono de `controllers/schemas/`: a saída provável é `backup.schema.ts`
  sair de `controllers/schemas/` para um lugar neutro (é peer de `backupRepository.ts`, de onde
  já importa `BACKUP_VERSION`, e valida linhas de banco, não payload de IPC).
- **`importData` chega por `repos.importBackup`, um método novo do agregado**, não por chamada
  direta — o service não pode segurar `db`. `exportData(repos)` continua função solta que o
  service chama (só leitura de repositórios).
- **Comportamento observável muda (decisão 4 da spec, já listada nos riscos):**
  `ordersService.delete` e `productsService.delete` lançam `AppError(404)` quando o id não
  existe — antes devolviam sucesso vazio.
- **Fora de escopo, deixado para o ticket 6:** `windowFor` continua em `backupHandlers.ts` (não
  virou `backupController.ts`); `handle.ts` continua com `channel: string`; as entidades ainda
  atravessam o IPC sem mapper, com o comentário que o ticket 4 deixou em `registerIpc.ts`.
