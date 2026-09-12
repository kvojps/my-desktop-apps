Status: done (QA manual pendente)

# Colapsar tipos de Repositório (árvore de varredura)

Blocked by: 01-colapsar-tipos-pull-request.md (domain/repo.ts importa tipos
de domain/pullRequest.ts)

## O que fazer

Colapsar `apps/git-dlog/src/main/domain/repo.ts` (12 tipos: `RepoSeverityEntity`,
`RepoCommitEntity`, `RepoBranchEntity`, `RepoWorktreeEntity`,
`RepoHeadEntity`, `RepoSyncEntity`, `RepoCommitGroupEntity`,
`RepoScanResultEntity`, `RepoFetchFailureEntity`, `RepoFetchResultEntity`,
`FetchPhaseEntity`, `RepoFetchProgressEntity`) nos tipos equivalentes de
`apps/git-dlog/src/shared/types/repoScan.ts` — hoje estruturalmente
idênticos (a única assimetria, `isWorktreeDirty`, é uma função de
apresentação que já vive só no lado shared, sem par no domain, e não é
afetada por este colapso).

## Checklist

- [x] Apagar `apps/git-dlog/src/main/domain/repo.ts` inteiro.
- [x] Apagar `apps/git-dlog/src/main/controllers/responses/repo.response.ts`
      (10 mappers — cópia 1:1 pura, confirmada por leitura). A regra "campo
      `error` ausente quando não houve falha, não `undefined`" não precisou
      migrar para `repoScanner.ts`: o caminho de sucesso de `scanRepo` já
      constrói o objeto sem a chave `error`, e o único chamador de
      `emptyResult` (o `catch`) sempre passa uma string — o `undefined`
      teórico do parâmetro opcional nunca ocorria na prática.
- [x] `infra/gateways/git/repoScanner.ts`: passa a devolver
      `RepoScanResult`/`RepoBranch`/`RepoHead`/etc. de
      `@shared/types/repoScan` direto, sem tipos `*Entity`. Removido também
      o comentário sobre a "travessia silenciosa" de `RepoWorktreeEntity`
      para `RepoWorktree` — deixou de existir, já que agora é o mesmo tipo.
- [x] `infra/gateways/git/repoFetcher.ts`: mesma troca para
      `RepoFetchResult`/`RepoFetchFailure`/`RepoFetchProgress`.
- [x] `services/reposService.ts` e `services/prsService.ts`: assinaturas
      trocam de `*Entity` para os tipos shared equivalentes.
- [x] `controllers/reposController.ts` consome o retorno do service direto,
      sem `repoScanResultToResponse`/etc.
- [x] `npm run typecheck` — limpo, sem erros.
- [x] `npm run lint` — 0 erros.
- [x] `npm test` — 238 testes, todos passando.
- [ ] QA manual (`npm run dev:dlog`): varrer diretórios, ver lista de
      repositórios com severidade (`risk`/`attention`/`clean`), abrir
      detalhe de um repositório (branches, worktree sujo, commits
      agrupados), "Buscar do remoto" com barra de progresso. **Pendente** —
      sandbox sem driver de UI Electron.
