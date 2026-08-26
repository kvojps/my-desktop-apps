import type {
  RepoBranch,
  RepoCommit,
  RepoCommitGroup,
  RepoFetchFailure,
  RepoFetchProgress,
  RepoFetchResult,
  RepoHead,
  RepoScanResult,
  RepoSync,
  RepoWorktree,
} from '@shared/types/repoScan';
import type {
  RepoBranchEntity,
  RepoCommitEntity,
  RepoCommitGroupEntity,
  RepoFetchFailureEntity,
  RepoFetchProgressEntity,
  RepoFetchResultEntity,
  RepoHeadEntity,
  RepoScanResultEntity,
  RepoSyncEntity,
  RepoWorktreeEntity,
} from '../../domain/repo';
import { pullRequestToResponse, repoRemoteToResponse } from './pullRequest.response';

/**
 * `entity → response` da árvore de varredura (README §2.5). É o maior mapper do
 * app — a árvore tem doze nós e a regra é que cada um ganhe o seu —, e o
 * critério de quais nós ganham função está no cabeçalho de
 * `pullRequest.response.ts`: objeto ganha, união de literais atravessa por
 * atribuição.
 */

/**
 * O commit é o nó comum de `RepoBranch`, `RepoHead` e `RepoCommitGroup`, e não
 * aparece sozinho em campo nenhum. Existe como mapper para que os quatro campos
 * dele sejam decididos uma vez, e não três — os três mappers que o espalham
 * declaram só o que acrescentam.
 */
export function repoCommitToResponse(entity: RepoCommitEntity): RepoCommit {
  return {
    commitHash: entity.commitHash,
    subject: entity.subject,
    author: entity.author,
    timestamp: entity.timestamp,
  };
}

export function repoBranchToResponse(entity: RepoBranchEntity): RepoBranch {
  return {
    ...repoCommitToResponse(entity),
    name: entity.name,
    isRemote: entity.isRemote,
    upstream: entity.upstream,
    ahead: entity.ahead,
    behind: entity.behind,
    gone: entity.gone,
    unpublished: entity.unpublished,
  };
}

export function repoHeadToResponse(entity: RepoHeadEntity): RepoHead {
  return {
    ...repoCommitToResponse(entity),
    branch: entity.branch,
    detached: entity.detached,
  };
}

export function repoCommitGroupToResponse(entity: RepoCommitGroupEntity): RepoCommitGroup {
  return {
    ...repoCommitToResponse(entity),
    branches: [...entity.branches],
  };
}

export function repoWorktreeToResponse(entity: RepoWorktreeEntity): RepoWorktree {
  return {
    staged: entity.staged,
    modified: entity.modified,
    untracked: entity.untracked,
    conflicted: entity.conflicted,
    stashes: entity.stashes,
  };
}

export function repoSyncToResponse(entity: RepoSyncEntity): RepoSync {
  return {
    upstream: entity.upstream,
    ahead: entity.ahead,
    behind: entity.behind,
  };
}

export function repoScanResultToResponse(entity: RepoScanResultEntity): RepoScanResult {
  return {
    path: entity.path,
    name: entity.name,
    remote: entity.remote ? repoRemoteToResponse(entity.remote) : null,
    appUrl: entity.appUrl,
    prs: entity.prs.map(pullRequestToResponse),
    mergedBranchesToClean: [...entity.mergedBranchesToClean],
    head: entity.head ? repoHeadToResponse(entity.head) : null,
    sync: repoSyncToResponse(entity.sync),
    worktree: repoWorktreeToResponse(entity.worktree),
    branches: entity.branches.map(repoBranchToResponse),
    groups: entity.groups.map(repoCommitGroupToResponse),
    unpublishedBranches: [...entity.unpublishedBranches],
    goneBranches: [...entity.goneBranches],
    lastFetchedAt: entity.lastFetchedAt,
    severity: entity.severity,
    // `error` é opcional dos dois lados, e a chave só existe quando a varredura
    // falhou. `error: entity.error` a criaria sempre, com `undefined` dentro —
    // o structured clone do IPC preserva a diferença, e "não falhou" deixaria
    // de ser a ausência do campo para virar um campo vazio.
    ...(entity.error === undefined ? {} : { error: entity.error }),
  };
}

export function repoFetchFailureToResponse(entity: RepoFetchFailureEntity): RepoFetchFailure {
  return {
    path: entity.path,
    name: entity.name,
    error: entity.error,
  };
}

export function repoFetchResultToResponse(entity: RepoFetchResultEntity): RepoFetchResult {
  return {
    results: entity.results.map(repoScanResultToResponse),
    failures: entity.failures.map(repoFetchFailureToResponse),
    prFailures: entity.prFailures.map(repoFetchFailureToResponse),
  };
}

/**
 * O progresso é o único response que não sai de um `handle`: ele vai pelo
 * `event.sender.send` do canal `repos:fetchProgress`. Atravessa o IPC como
 * qualquer outro, então tem mapper como qualquer outro.
 */
export function repoFetchProgressToResponse(entity: RepoFetchProgressEntity): RepoFetchProgress {
  return {
    phase: entity.phase,
    done: entity.done,
    total: entity.total,
    current: entity.current,
  };
}
