import type { PullRequest, RepoRemote } from './pullRequest';

/**
 * Severidade de um repositório, do mais para o menos urgente:
 * - `risk`      — há trabalho que só existe nesta máquina (working tree suja,
 *                 conflitos, stashes ou branch local nunca publicada).
 * - `attention` — o trabalho está salvo no git, mas fora de sincronia com o
 *                 remoto (ahead/behind) ou com branches órfãs para limpar.
 * - `clean`     — nada a fazer.
 */
export type RepoSeverity = 'risk' | 'attention' | 'clean';

export interface RepoCommit {
  commitHash: string;
  subject: string;
  author: string;
  /** Unix timestamp em segundos (committer date). */
  timestamp: number;
}

export interface RepoBranch extends RepoCommit {
  /** Nome curto: `main`, `feat/x`, `origin/main`. */
  name: string;
  isRemote: boolean;
  /** Nome curto do upstream (`origin/main`) ou `null` se não houver. */
  upstream: string | null;
  ahead: number;
  behind: number;
  /** O upstream configurado não existe mais no remoto (`[gone]`). */
  gone: boolean;
  /** Branch local sem upstream: nunca foi publicada. */
  unpublished: boolean;
}

export interface RepoWorktree {
  staged: number;
  modified: number;
  untracked: number;
  conflicted: number;
  stashes: number;
}

export interface RepoHead extends RepoCommit {
  /** `null` quando o HEAD está detached ou o repositório não tem commits. */
  branch: string | null;
  detached: boolean;
}

export interface RepoSync {
  upstream: string | null;
  ahead: number;
  behind: number;
}

/** Branches que apontam para o mesmo commit, agrupadas para exibição. */
export interface RepoCommitGroup extends RepoCommit {
  branches: string[];
}

export interface RepoScanResult {
  path: string;
  name: string;
  /** Remote principal (`origin`), lido do `.git/config`. */
  remote: RepoRemote | null;
  /**
   * URL do site publicado deste projeto — o endereço que o usuário final
   * acessa, sem relação com o remote. Vem de `git config dlog.url` e já chega
   * validada como http/https. `null` quando não foi anotada.
   */
  appUrl: string | null;
  /** PRs conhecidos; preenchido só depois de um "Buscar do remoto". */
  prs: PullRequest[];
  /** Branches locais cujo PR já foi mergeado — candidatas a apagar. */
  mergedBranchesToClean: string[];
  head: RepoHead | null;
  sync: RepoSync;
  worktree: RepoWorktree;
  branches: RepoBranch[];
  groups: RepoCommitGroup[];
  /** Nomes das branches locais que nunca foram publicadas. */
  unpublishedBranches: string[];
  /** Nomes das branches locais cujo upstream foi apagado no remoto. */
  goneBranches: string[];
  /** ISO date do último `git fetch` (mtime de `.git/FETCH_HEAD`), ou `null`. */
  lastFetchedAt: string | null;
  severity: RepoSeverity;
  error?: string;
}

export interface RepoFetchFailure {
  path: string;
  name: string;
  error: string;
}

export interface RepoFetchResult {
  results: RepoScanResult[];
  /** Falhas do `git fetch`. */
  failures: RepoFetchFailure[];
  /** Falhas da consulta de pull requests. */
  prFailures: RepoFetchFailure[];
}

/** O "Buscar do remoto" tem duas etapas de rede; a UI distingue as duas. */
export type FetchPhase = 'git' | 'prs';

export interface RepoFetchProgress {
  phase: FetchPhase;
  done: number;
  total: number;
  /** Nome do repositório que acabou de ser processado. */
  current: string;
}

export function isWorktreeDirty(worktree: RepoWorktree): boolean {
  return (
    worktree.staged > 0 ||
    worktree.modified > 0 ||
    worktree.untracked > 0 ||
    worktree.conflicted > 0
  );
}
