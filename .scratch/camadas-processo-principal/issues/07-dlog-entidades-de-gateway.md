Status: aberto
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
