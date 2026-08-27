Status: resolvido
Blocked by: 05

# Meu Negócio: controllers

Espelha `.scratch/camadas-processo-principal/issues/09-dlog-controllers.md`.

## Um controller por domínio

`ordersController.ts`, `productsController.ts`, `settingsController.ts`,
`backupController.ts` — cada um faz `parseOrThrow` na entrada (schemas já existem em
`controllers/schemas/`, movidos no ticket 2) e o mapa `entity → response` na saída.

`theme:set`/`app:getInfo` seguem o precedente do `systemController.ts` do `git-dlog` se não
coubverem no `settingsController` — decisão de nomeação fica para quem implementar, mesmo
carve-out que o ticket 09 do `git-dlog` documentou para `settings:saveThemeMode`.

## `handle.ts`

Deixa de aceitar `channel: string`; passa a receber o tipo derivado de `IPC_CHANNELS`, mesma
mudança do `git-dlog`:

```ts
type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
export function handle(channel: IpcChannel, listener: IpcListener): void
```

## Mappers

`controllers/responses/order.response.ts`, `product.response.ts` — é aqui que `stockApplied`
sai do `OrderItemEntity` e não chega ao `OrderItem` de `shared/types/`. Um mapper por nó que é
objeto (README §2.5); união de literais (`OrderStatus`) atravessa por atribuição direta.

`windowFor` (hoje em `backupHandlers.ts`) migra para o controller de backup — é fronteira de
IPC.

## `registerIpc.ts`

Monta as camadas e registra:

```ts
const repos = makeRepositories(db);
const ordersService = makeOrdersService(repos);
const productsService = makeProductsService(repos);
const settingsService = makeSettingsService(repos, themeGateway);
const backupService = makeBackupService(repos, fileSystemGateway, dialogsGateway, shellGateway);
registerOrdersController(ordersService);
registerProductsController(productsService);
registerSettingsController(settingsService);
registerBackupController(backupService);
```

Vigiar o tamanho — 4 domínios contra os do `git-dlog`, risco já registrado na spec.

## Verificação

`npm run typecheck`, `npm run lint`, `npm run test`, `electron-vite build`. Nenhum dos treze
(ou quantos existirem) canais deve chegar ao service sem `parseOrThrow`, nem voltar ao renderer
sem mapper.

## Comments

### 2026-08-27 — implementado

Quatro controllers em `controllers/`, um por domínio, cada um só com a fronteira: `parseOrThrow`
/ `parseId` na entrada, `entity → response` na saída. `registerIpc.ts` virou 15 linhas de
composição rasa (nenhum service depende de outro) mais 4 de registro. `backupHandlers.ts` foi
apagado — virou `backupController.ts`. `windowFor` saiu para `controllers/windowFor.ts` (ver
"Depois da revisão").

`handle.ts` deixou de aceitar `channel: string`: agora é `IpcChannel`, o mesmo tipo que
`READ_ONLY_CHANNELS` já usava — registro e classificação falam do mesmo conjunto de canais.
Mesma mudança e mesmo comentário (pós-revisão) do ticket 09 do `git-dlog`.

**Mappers** (`controllers/responses/`):

- `product.response.ts` → `productToResponse`. `ProductEntity` e `Product` são idênticos hoje;
  o mapper existe para que continuem assim por decisão e não por identidade estrutural.
- `order.response.ts` → `orderItemToResponse` + `orderToResponse`. É aqui que `stockApplied`
  sai do item e não chega ao `OrderItem` de `shared/`. `status` (`OrderStatus`) atravessa por
  atribuição direta — união de literais, o `tsc` já quebra sozinho na variante nova. `manualTotal`
  é opcional dos dois lados e entra por spread condicional (mesmo tratamento que o `git-dlog` deu
  ao `error` de `RepoScanResult` pós-revisão): a chave só existe quando há total manual, senão
  seria um campo `undefined` no structured clone em vez de ausência.
- `order.response.ts` também tem `setOrderStatusResultToResponse` e `deleteOrderResultToResponse`
  (ver "Depois da revisão"): os envelopes `{ order, updatedProducts }` / `{ updatedProducts }` são
  nós que são objeto e atravessam o IPC, então têm mapper próprio. É aqui que o
  `productToResponse` do outro domínio entra, na pasta que existe para um controller não importar
  o outro.

### Divergências e decisões

- **`app:getInfo` e `theme:*` ficaram no `settingsController`, não num `systemController`.** O
  plano (`§5`/`§6`) previa um `systemController`/`systemService` "se sobrar algo de `app:getInfo`
  que não caiba nos outros", mas o ticket 05 fechou com quatro services e nenhum `systemService`,
  e o próprio ticket 6 enumera quatro controllers e mostra quatro `register*Controller` no
  `registerIpc.ts`. Um quinto arquivo com um handler de uma linha contaria uma história que o app
  não tem. `theme:*` já era do `settingsService` (`getThemeMode`/`saveThemeMode`); `app:getInfo`
  ganhou `settings.getAppInfo()`, que costura um gateway novo — `infra/gateways/system/appInfo.ts`
  (`version()` via `app.getVersion()`, `dbPath()` via `getDbPath()`). O `settingsController` faz
  `makeSettingsService(repos, themeMode, appInfo)` agora. Isso tira do controller o acesso cru a
  `electron`/`infra/database/connection` que o `registerIpc.ts` antigo tinha inline — a versão e
  o caminho do banco passam a chegar por camada, como qualquer outra saída.
- **`settings:get`/`settings:update` não têm mapper de saída.** `settingsRepository` devolve
  `CompanySettings` (o tipo de `shared/`) direto — decisão do ticket 05, que não criou
  `CompanySettingsEntity` ("ou reaproveita"). Sem entidade, não há `entity → response` a
  escrever; o controller repassa. `app:getInfo` idem (`AppInfo` vem do gateway, não é entidade),
  seguindo a regra do `systemController` do `git-dlog` ("nenhum devolve entidade, então nenhum
  tem mapper").
- **`backupService` continua importando `backupSchema` de `controllers/schemas/backup.schema.ts`.**
  É a inversão de camada que o ticket 05 registrou como dívida "para o ticket 6". Considerei
  mover `backup.schema.ts` para junto de `backupRepository.ts` (de onde já importa
  `BACKUP_VERSION`), mas isso troca a dívida por outra: o schema reusa `orderStatusSchema` e
  `companySettingsSchema` de `controllers/schemas/`, e movê-lo faria `infra/` importar de
  `controllers/` — ou duplicaria os dois schemas, com risco de drift silencioso. Nenhuma das
  saídas é claramente melhor, e o ticket 6 trata `controllers/schemas/` como o lar já assentado
  ("schemas já existem em `controllers/schemas/`, movidos no ticket 2"). Deixado para o **ticket
  7** (limpezas), que é dono desse tipo de dívida.
- **Cleanup fora do enunciado:** um `const orderNotFound = … =>\n  new AppError(…)` em
  `ordersService.ts` (do ticket 5) quebrava o `prettier --check` do branch — cabia em 100
  colunas numa linha. Colapsado, para o `format:check` do branch ficar verde para a revisão.

### Depois da revisão

`/code-review` (Standards + Spec em paralelo, fixado em `fa52bb8`), duas mudanças:

- **Envelopes de `setStatus`/`delete` ganharam mapper.** A versão inicial montava
  `{ order: orderToResponse(...), updatedProducts: [...].map(productToResponse) }` inline no
  controller. `SetOrderStatusResult`/`DeleteOrderResult` são nós que são objeto e diferem entre
  a entidade (`OrderEntity`/`ProductEntity[]`) e o response (`Order`/`Product[]`) — README §2.5
  pede mapper para eles, e o `git-dlog` tem o precedente exato (`repoFetchResultToResponse`).
  Viraram `setOrderStatusResultToResponse`/`deleteOrderResultToResponse` em `order.response.ts`,
  que passou a importar `productToResponse` do irmão `product.response.ts` (mesmo import lateral
  que `repo.response.ts` → `pullRequest.response.ts` no `git-dlog`). Sumiu a duplicação do
  `.map(productToResponse)`.
- **`windowFor` saiu para arquivo próprio** — `controllers/windowFor.ts`, byte-a-byte como o do
  `git-dlog`. O enunciado diz "migra para o controller de backup", mas o README §2.2 lista
  `windowFor.ts` como peer de `handle.ts`/`notifyDataChanged.ts` e a spec inteira espelha o
  `git-dlog`; "para o controller de backup" fica satisfeito em espírito (sai de `backupHandlers.ts`,
  cai na camada de controllers, é usado só pelo fluxo de backup).

Duas observações da revisão que **não** viraram mudança:

- **Spec — `makeSettingsService` ganhou um 3º parâmetro (`appInfo`).** O sample do ticket mostra
  `makeSettingsService(repos, themeGateway)`. Mas o ticket manda `app:getInfo` "seguir o
  precedente do `systemController` do `git-dlog`", e esse precedente (ticket 09, comentário 3)
  foi exatamente "nasceu um service + gateways que a spec não lista" para não pular a camada de
  service. O gateway novo é o preço declarado desse precedente, não escopo a mais — só ficou no
  `settingsService` em vez de um `systemService` novo, escolha que o ticket delega
  ("decisão de nomeação fica para quem implementar") e que casa com o sample de 4 controllers.
- **Spec — comentário do `handle.ts`.** É cópia literal da versão pós-revisão do `handle.ts` do
  `git-dlog` (ticket 09). "As duas pontas" ali são `READ_ONLY_CHANNELS` e `handle`, ambas
  `IpcChannel`; `shouldNotifyDataChanged(channel: string)` continua largo de propósito (decisão
  do ticket 03, com teste). Mantido igual ao `git-dlog` para os dois arquivos não divergirem.

### Verificação

`npm run typecheck` (4 apps), `npm run lint` (0 erros; os 2 warnings pré-existentes de
`react-hooks/exhaustive-deps` em `OrdersContext.tsx`/`ProductsContext.tsx`), `npm run test`
(21 arquivos, 187 testes — nenhum novo, adiamento do ADR-0002, decisão 9 da spec),
`prettier --check` e `electron-vite build` do app (main/preload/renderer, exit 0).

Nenhum canal chega ao service sem `parseOrThrow`/`parseId`, nem volta ao renderer sem mapper —
exceto os que não têm entidade (`settings:*`, `app:getInfo`, `data:*`) e os que atravessam
união de literais por atribuição (`theme:*`), ambos documentados acima e no cabeçalho de cada
controller.
