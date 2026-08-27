Status: aberto
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
