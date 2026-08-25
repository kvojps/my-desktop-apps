Status: aberto
Blocked by: 08

# git-dlog: controllers

Um controller por domínio: `scanPathsController.ts`, `reposController.ts`,
`prsController.ts`, `systemController.ts`. Cada um faz `parseOrThrow` na entrada e o mapa
`entity → response` na saída.

**Nenhuma camada é pulável.** Dos treze canais, a maioria não tem decisão nenhuma
(`scanPaths:getAll` é hoje um repasse de uma linha), e mesmo assim atravessa
controller → service → repositório. É o preço da estrutura sem exceção, e foi decidido de
olhos abertos: estrutura com exceção não conta história.

`data:openFolder` e `shell:openExternal` também atravessam — o gateway deles é
`infra/gateways/system/`.

## `handle.ts`

Deixa de aceitar `channel: string`. Passa a receber o tipo derivado de `IPC_CHANNELS`:

    type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
    export function handle(channel: IpcChannel, listener: IpcListener): void

Hoje o canal é string livre e todo payload chega como `unknown`, o que faz o `handle` não
oferecer garantia nenhuma além do `toIpcError`.

## `registerIpc.ts`

Monta as camadas e registra, nesta ordem:

    const repos = makeRepositories(db);
    const scanPathsService = makeScanPathsService(repos, fsGateway);
    registerScanPathsController(scanPathsService);

Ele acumula compor e registrar — aceito por decisão, mas é o arquivo a vigiar quando os apps
maiores chegarem (`meu-dinheiro-app` tem hoje 284 linhas de `registerIpc.ts`).

## Comments
