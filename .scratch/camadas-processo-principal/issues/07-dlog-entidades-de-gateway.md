Status: resolvido
Blocked by: 04

# git-dlog: entidades de gateway

**O maior ticket da leva.** Vale dividir na hora de executar se o diff ficar grande demais
para revisar de uma vez.

`domain/repo.ts` e `domain/pullRequest.ts` espelhando as árvores que hoje vivem só em
`shared/types/`:

- `shared/types/repoScan.ts` — 122 linhas: `RepoSeverity`, `RepoCommit`, `RepoBranch`,
  `RepoWorktree`, `RepoHead`, `RepoSync`, `RepoCommitGroup`, `RepoScanResult`,
  `RepoFetchFailure`, `RepoFetchResult`, `FetchPhase`, `RepoFetchProgress`.
- `shared/types/pullRequest.ts` — 54 linhas: `PullRequest`, `PullRequestState`,
  `ReviewDecision`, `ChecksState`, `RepoRemote`, `PrProviderStatus`, `PrIntegrationStatus`.

Com mapeamento sempre explícito, **cada nó ganha entidade e mapper**. É o preço da regra e é
aqui que ele mais dói.

Os gateways de `infra/gateways/git/` e `infra/gateways/pr/` passam a devolver entidade. Eles
já são o lugar certo: nenhum importa `better-sqlite3` nem `electron`, são Node puro e recebem
tudo por parâmetro (inclusive o token, como `string | null`).

`infra/gateways/pr/ghCli.ts` já tem o padrão pronto: `toPullRequest(pr: GhPullRequest)` é um
mapper anticorrupção em tudo menos no nome — a forma do GitHub entrando e virando a forma de
casa. O mesmo movimento, agora nomeado.

## Atenção

`isWorktreeDirty` fica em `shared/types/repoScan.ts` — é usado pelo renderer
(`renderer/src/components/RepoCard.tsx`) e é predicado de apresentação, não regra. O ADR-0003
(ticket 01) registra a exceção por nome.

## Comments

`domain/repo.ts` e `domain/pullRequest.ts` criados com os 19 nós — os 12 de `repoScan.ts` e os
7 de `pullRequest.ts`. Os gateways de `git/` e `pr/` devolvem entidade, e `prsService.ts` e
`registerIpc.ts` acompanharam pelo tipo, sem que nada de 08/09/10 fosse adiantado.

Três mappers anticorrupção nomeados, não um: além do `toPullRequest` do `ghCli.ts` que o
ticket cita (agora `ghPrToPullRequest`), o mesmo movimento estava inline em `glabCli.ts` e em
`githubToken.ts`. Extraí os dois — `glabMrToPullRequest` e `graphQlPrToPullRequest` —, porque
a regra é "mapeamento sempre explícito" e um mapper anônimo dentro de um `.map()` não é menos
mapper por não ter nome. Os três ficam lado a lado com os mesmos onze campos: é duplicação
visível e deliberada, o preço de cada provedor ter a sua própria camada anticorrupção.

O ticket enumera os tipos de `pullRequest.ts` sem `RemoteKind` e `PrProviderKind`. A lista
estava incompleta — os dois são referenciados pelos nós que ela lista —, então os dois
ganharam entidade também.

Três decisões que divergem do enunciado ou que ele não previu:

1. **`RepoFetchResultEntity` nasce sem call site.** O ticket manda espelhar `RepoFetchResult`,
   e o único lugar que hoje monta esse objeto é o handler de `repos:fetch` — que é controller.
   Cheguei a anotá-lo com a entidade e voltei atrás: aquela anotação é a **única** coisa que
   ainda confere se o que atravessa o canal casa com o contrato que o renderer espera (o
   `invoke` do preload não checa nada em runtime), e trocá-la pela entidade calaria o
   compilador justamente onde o mapper falta. A entidade fica esperando o `reposService` do
   ticket 08; a anotação do controller segue no tipo de `@shared`, com o porquê no comentário.
2. **A travessia silenciosa do `isWorktreeDirty` está marcada no código.** A exceção da seção
   "Atenção" foi respeitada — o helper fica em `shared` —, mas ela cobra um preço que o ticket
   não menciona: `computeSeverity` entrega um `RepoWorktreeEntity` a um parâmetro
   `RepoWorktree`, e isso só typecheca pela identidade estrutural, que é exatamente a troca
   que o sufixo `Entity` existe para o TypeScript pegar. É a mesma tensão que o ADR-0003
   admite ao dizer "se um dia ele passar a decidir alguma coisa, vira entidade em
   `main/domain/`" sobre um helper que já decide severidade no main. Não mudei a decisão;
   deixei o custo escrito no import.
3. **`PrFetchFailure` continua duplicando `RepoFetchFailureEntity`** campo a campo em
   `prsService.ts`. Unificar é do ticket 10, que o cita pelo nome.

`npm run typecheck`, `npm run lint` (os 2 warnings pré-existentes de `react-hooks/exhaustive-deps`
no Meu Negócio), `npm run test` (20 arquivos, 179 testes) e `electron-vite build` do app passam.
Nenhum `.test.ts` novo: o ADR-0002 adia os testes desta leva de propósito.
