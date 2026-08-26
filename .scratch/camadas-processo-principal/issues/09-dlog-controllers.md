Status: resolvido
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

Os quatro controllers existem, `registerIpc.ts` virou dezoito linhas de composição mais quatro
de registro, e nenhum dos treze canais chega ao service sem `parseOrThrow` nem volta ao
renderer sem mapper. `handle` deixou de aceitar `string`: o tipo `IpcChannel` já existia em
`shared/ipc/channels.ts` (é o que tipa `READ_ONLY_CHANNELS`), então bastou usá-lo em vez de
derivá-lo de novo — agora as duas pontas do mecanismo de invalidação falam do mesmo conjunto.

Cinco pontos em que divergi do enunciado ou em que ele não previu:

1. **Os mappers ficaram em `controllers/responses/`, não dentro de cada controller.** A
   forçante é concreta: `repoScanResultToResponse` precisa de `pullRequestToResponse` e
   `repoRemoteToResponse`, que são o conteúdo natural do controller de PRs — inline, o
   controller de repos importaria o de PRs, que é import lateral dentro da mesma camada. A
   pasta é irmã de `schemas/`, uma para cada sentido da fronteira, e continua sendo camada de
   controller. O README §2.2 e §2.5 foram atualizados junto: a pasta entrou na árvore e o
   bullet de `entity → response` diz onde a função mora.
2. **Mapper é por nó que é objeto; união de literais atravessa por atribuição.** Doze mappers
   novos, nenhum para `RepoSeverity`, `PullRequestState`, `ReviewDecision`, `ChecksState`,
   `RemoteKind`, `PrProviderKind`, `FetchPhase` ou `ThemeMode`. O motivo é que o `tsc` já
   quebra sozinho ao atribuir uma união que ganhou variante de um lado só — que é exatamente a
   decisão que o mapper existiria para forçar. Com objeto ele não quebra (campo a mais
   continua atribuível), e aí o mapper é a única trava. É a mesma regra que decide que o
   `ThemeMode` validado entra no `settingsService` sem mapper de entrada. O critério está
   escrito em `responses/pullRequest.response.ts` e no README §2.5.
3. **Nasceu um `systemService.ts` que a spec não lista.** O ticket diz que `data:openFolder` e
   `shell:openExternal` também atravessam, e "atravessar" com o controller chamando o gateway
   direto seria pular a camada de service — a exceção que o ADR-0002 recusa. `dialog:selectDirectory`
   entrou junto pelo mesmo argumento. São três repasses de uma linha, e é o preço declarado.
   Dois gateways novos em `infra/gateways/system/`: `shell.ts` (navegador padrão e pasta de
   dados) e `dialogs.ts` (o `showOpenDialog`).
4. **A janela do diálogo atravessa o service como valor opaco.** `event.sender` é fronteira de
   IPC e o `windowFor` fica no controller, mas o `showOpenDialog` precisa da janela para ser
   modal. O service a repassa sem lê-la, tipada pelo apelido `DialogParentWindow` que o próprio
   gateway exporta — é o que permite escrever a assinatura sem importar `electron` no service,
   pela mesma razão que os outros gateways de `system/` chegam por parâmetro.
5. **Não há `settingsController.ts`.** O ticket enumera quatro controllers e conta treze
   canais; `settings:saveThemeMode` é o único canal de `settings` e o que ele grava só se
   enxerga na moldura nativa, então ficou no `systemController`. Quando `settings` ganhar um
   segundo canal, o controller próprio nasce.

Uma limpeza que não estava no ticket e que a divisão por domínio cobrou: `externalUrlSchema`
morava em `schemas/prs.schema.ts` e é a entrada de `shell:openExternal`. Com um controller por
domínio, o schema do canal de sistema no arquivo de PRs viraria um import cruzado sem motivo —
foi para `schemas/system.schema.ts`, sem mudar uma linha da validação.

`clearPrCache`, `PrFetchFailure` e o `windowFor` duplicado continuam de pé: são do ticket 10,
que os cita pelo nome. Nenhum `.test.ts` novo — o ADR-0002 adia os testes desta leva de
propósito, e os mappers puros que este ticket cria são o primeiro lugar óbvio para eles quando
a leva terminar.

### Depois da revisão

Quatro correções vieram do `/code-review`:

- **A árvore do README §2.2 tinha ficado meio atualizada.** Ganhou `responses/` e continuou
  sem `scanPathsController.ts`, sem `scanPathsService.ts` e sem `systemService.ts`. As linhas
  não têm reticências, então liam-se como completas — enumeração incompleta num documento
  normativo é pior que enumeração ausente. As três foram completadas.
- **O comentário do `handle.ts` prometia mais do que o commit entrega.** Dizia que "as duas
  pontas do mecanismo falam do mesmo conjunto de canais", mas `shouldNotifyDataChanged`
  continua recebendo `string`. E deve continuar: tratar canal desconhecido como escrita é
  decisão do ticket 03 e tem teste (`channels.test.ts`). Estreitar a assinatura apagaria o
  lado seguro; o comentário é que foi corrigido.
- **`error: entity.error` criava a chave sempre.** `RepoScanResult.error` é opcional e só
  existe quando a varredura falhou; o structured clone preserva a diferença entre ausente e
  `undefined`. Virou spread condicional. O renderer só testa veracidade, então não havia bug
  visível — mas "nada atravessa sem alguém ter decidido" vale para a chave, não só para o
  valor.
- **Dois estilos de `.map` no mesmo diff** (sete point-free, dois com arrow). Unificados em
  point-free.

Duas observações da revisão que **não** viraram mudança de código:

1. **O `parseId` de `scanPaths:delete` não é exceção ao `parseOrThrow`** — ele *é* um
   `parseOrThrow(idSchema, …)`, e o README §2.2 manda exatamente isso ("toda entrada (…) por
   `parseOrThrow` (…) e todo id por `parseId`").
2. **A regra de mapeamento foi refinada num ticket de implementação, e isso é discutível.** A
   tabela da spec diz "Mapeamento | Sempre explícito"; o §2.5 do README agora diz "um mapper
   por nó que é objeto". O raciocínio está no item 2 acima e continua de pé, e o §2.5 é o
   lugar onde essa regra já morava (o ADR-0002 só a referencia) — mas quem quiser tratar o
   refinamento como decisão de ADR tem argumento. Fica registrado aqui em vez de passar em
   silêncio.

`npm run typecheck`, `npm run lint` (os 2 warnings pré-existentes de `react-hooks/exhaustive-deps`
no Meu Negócio), `npm run test` (20 arquivos, 179 testes), `prettier --check` e o
`electron-vite build` do app passam.
