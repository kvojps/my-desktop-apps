Status: done (QA manual pendente)

# Colapsar tipos de Pull Request

Blocked by: nada (primeira issue do ciclo)

## O que fazer

Colapsar `apps/git-dlog/src/main/domain/pullRequest.ts` (`PullRequestEntity`,
`RepoRemoteEntity`, `PrProviderStatusEntity`, `PrIntegrationStatusEntity`,
`PullRequestStateEntity`, `ReviewDecisionEntity`, `ChecksStateEntity`,
`RemoteKindEntity`, `PrProviderKindEntity`) nos tipos equivalentes de
`apps/git-dlog/src/shared/types/pullRequest.ts` (`PullRequest`, `RepoRemote`,
`PrProviderStatus`, `PrIntegrationStatus`, `PullRequestState`,
`ReviewDecision`, `ChecksState`, `RemoteKind`, `PrProviderKind`) — hoje
estruturalmente idênticos, confirmado por leitura direta dos dois arquivos.

## Checklist

- [x] Apagar `apps/git-dlog/src/main/domain/pullRequest.ts`.
- [x] Apagar `apps/git-dlog/src/main/controllers/responses/pullRequest.response.ts`
      (`repoRemoteToResponse`, `pullRequestToResponse`,
      `prProviderStatusToResponse`, `prIntegrationStatusToResponse` — cópia
      1:1 pura, confirmada por leitura).
- [x] `infra/gateways/git/remoteUrl.ts`: trocar `RepoRemoteEntity` por
      `RepoRemote` de `@shared/types/pullRequest`.
- [x] `infra/gateways/pr/ghCli.ts`, `infra/gateways/pr/githubToken.ts`,
      `infra/gateways/pr/glabCli.ts`: trocar `PullRequestEntity`/
      `PrProviderStatusEntity`/etc. pelos tipos shared equivalentes.
- [x] `services/prsService.ts`: assinaturas trocam de `*Entity` para os
      tipos shared; `controllers/prsController.ts` consome o retorno do
      service direto (sem `prIntegrationStatusToResponse`/etc.).
- [x] `controllers/responses/pullRequest.response.ts` deixa de existir —
      confirmado que nenhum outro arquivo importa dele.
- [x] Efeito colateral: como as issues 01 e 02 foram executadas juntas (a
      dependência cruzada entre `domain/repo.ts` e `domain/pullRequest.ts`
      tornava a separação em dois commits artificial), `domain/repo.ts` e
      `repo.response.ts` foram apagados diretamente na issue 02, em vez de
      só terem o import redirecionado.
- [x] `npm run typecheck` — limpo, sem erros.
- [x] `npm run lint` — 0 erros (2 warnings pré-existentes em outro app, sem
      relação com esta mudança).
- [x] `npm test` — 238 testes, todos passando.
- [ ] QA manual (`npm run dev:dlog`): abrir um repositório com PR aberto, ver
      status de review/checks, e a tela de Configurações mostrando o status
      de integração (`gh`/`glab`/token). **Pendente** — sandbox sem driver de
      UI Electron.
