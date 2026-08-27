Status: resolvido
Blocked by: 03

# Meu Negócio: entidades de persistência e de gateway

Colapsa em um ticket só o que no `git-dlog` foram dois
(`.scratch/camadas-processo-principal/issues/06-dlog-entidades-de-persistencia.md` e
`07-dlog-entidades-de-gateway.md`) — a superfície de mundo externo deste app (disco + diálogo +
`shell.openPath`, só para backup) é estreita demais para justificar dois tickets.

## Entidades de persistência

- `domain/order.ts`: `OrderEntity`, `OrderItemEntity`, `OrderStatus`. `OrderItemEntity` carrega
  `stockApplied: number` — é o campo que fica fora do `OrderItem` de `shared/types/`, e com a
  entidade separada do response ele vira estrutura, não comentário. **Não** nasce uma entidade
  `StockLedger` à parte: é campo do item, seguindo o glossário já resolvido em `CONTEXT.md`
  ("Escrituração de estoque").
- `domain/product.ts`: `ProductEntity`.
- `rowToX` explícito em cada repositório (`infra/database/repositories/ordersRepository.ts`,
  `productsRepository.ts`) — a função já existe (`rowToItem`, `buildOrder`, `rowToProduct`), só
  muda de forma para produzir a entidade em vez do tipo de `shared/types/` direto.

## Entidades de gateway

Fonte real é `src/main/ipc/backupHandlers.ts` (não `db/backupRepository.ts` — ver o achado
corrigido na spec, item 6 do Problema). Três gateways novos em `infra/gateways/system/`, mesmos
nomes do `git-dlog`:

- `fileSystem.ts` — ler e escrever o arquivo de backup (`fs.readFile`/`fs.writeFile`, hoje
  inline em `backupHandlers.ts`).
- `dialogs.ts` — `showSaveDialog`/`showOpenDialog` do backup.
- `shell.ts` — `shell.openPath` (abrir a pasta de dados).

O `windowFor` que hoje vive em `backupHandlers.ts` fica para o ticket 6 (controllers) — é
fronteira de IPC, não gateway.

## Verificação

`npm run typecheck`, `npm run lint`, `npm run test`. Nenhum objeto que sai de um repositório ou
gateway deve carregar chave snake_case.

## Comments

### 2026-08-27 — implementado

`domain/order.ts` (`OrderStatusEntity`, `OrderItemEntity` com `stockApplied`, `OrderEntity`) e
`domain/product.ts` (`ProductEntity`) nasceram com a forma do `git-dlog` — `type` anêmico,
sufixo `Entity`, sem import de `@shared/types/`. `rowToItem`/`buildOrder`
(`ordersRepository.ts`) e `rowToProduct`/`getProductById`/`adjustProductStock`
(`productsRepository.ts`) passaram a produzir a entidade em vez do tipo de `shared/types/`
direto, como o ticket pediu.

`OrderItemRow` ganhou a coluna `stock_applied` e `rowToItem` passou a mapeá-la para
`stockApplied` — a `StockLedgerRow`/`getStockLedger` que existia só para ler essa coluna
separadamente virou redundante e saiu; `findStockShortages`/`deductStockForOrder`/
`restoreStockForOrder` leem `getItemsForOrder` (já `OrderItemEntity[]`) em vez da leitura
duplicada. É a mesma regra de negócio de antes, só sem o tipo repetido.

`create`/`update` de `ordersRepository.ts` passaram a reconsultar via `findById` depois de
gravar, em vez de devolver o objeto montado localmente: `data.items` (`OrderItem[]` de
`shared/types/`) não carrega `stockApplied`, e só a releitura do banco produz a entidade de
verdade — os itens recém-gravados sempre entram com `stockApplied = 0` (default do schema),
que é exatamente o que a releitura confirma. Segue o mesmo idioma que `setStatus`/
`setPaymentAmount` já usavam.

Três gateways novos em `infra/gateways/system/`, mesmos nomes e forma do `git-dlog`
(`fileSystem.ts`, `dialogs.ts`, `shell.ts`). `backupHandlers.ts` trocou `fs`/`dialog`/`shell`
inline por eles; `windowFor` ficou onde estava, como o ticket mandou ("é fronteira de IPC, não
gateway", ticket 6). Os gateways ainda são chamados direto do controller, não de um service —
não há `services/backupService.ts` ainda (ticket 5); é o mesmo carve-out que `registerIpc.ts`
já tinha para orders/products desde o ticket 3.

`npm run typecheck` (4 apps), `npm run lint` (0 erros, os mesmos 2 warnings pré-existentes de
`react-hooks/exhaustive-deps`, alheios a este ticket) e `npm run test` (187 passando, nenhum
teste novo — adiamento do ADR-0002, igual ao ticket 03).

### Divergências registradas, não resolvidas aqui

- **`OrderStatusEntity`, não `OrderStatus`.** O texto do ticket lista os três exports de
  `domain/order.ts` como "`OrderEntity`, `OrderItemEntity`, `OrderStatus`" — sem sufixo no
  terceiro. README §2.2 é explícito: o sufixo `Entity` é obrigatório para tipo de `domain/`, e
  `RepoSeverityEntity`/`ThemeModeEntity` do `git-dlog` já sufixam até uniões de literais. Segui
  o README, não a prosa do ticket — o tipo chama `OrderStatusEntity`.
- **Entidade ainda atravessa o IPC sem mapper**, nos dois domínios. `registerIpc.ts` chama
  `repos.orders.*`/`repos.products.*` direto em `handle(...)`, sem `controllers/responses/`
  (ticket 6). Para orders isso é um vazamento de verdade: `items[].stockApplied` — o caso que
  motiva o mapper em README §2.5 — chega ao renderer sem que nada o filtre. Para products não
  há vazamento hoje: `ProductEntity` é estruturalmente igual a `Product` de `shared/types/`,
  mas nada garante que continue igual. Comentário em `registerIpc.ts` marca os dois pontos até
  o ticket 6, mesmo padrão do `git-dlog` (ticket 06/07 dessa leva, sobre `ThemeModeEntity`).
- **`ordersRepository.ts` continua acoplado a `productsRepository.ts`** e o clamp de estoque
  (`Math.max(0, ...)` em `adjustProductStock`) continua no repositório — os dois já eram
  divergência registrada do ticket 03, migram para o service no ticket 5.
