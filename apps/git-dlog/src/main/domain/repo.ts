import type { PullRequestEntity, RepoRemoteEntity } from './pullRequest';

/**
 * O vocabulário de repositórios git do processo principal: o que a varredura lê
 * de um diretório e o que a busca no remoto devolve sobre ela.
 *
 * Estas entidades são estruturalmente idênticas aos tipos de
 * `@shared/types/repoScan`, e o porquê do sufixo `Entity` está em
 * `domain/scanPath.ts`. `isWorktreeDirty` **não** tem par aqui: é predicado de
 * apresentação e fica no contrato, em `@shared/types/repoScan` — o ADR-0003 o
 * nomeia e registra a exceção.
 */

/**
 * Severidade de um repositório, do mais para o menos urgente:
 * - `risk`      — há trabalho que só existe nesta máquina (working tree suja,
 *                 conflitos, stashes ou branch local nunca publicada).
 * - `attention` — o trabalho está salvo no git, mas fora de sincronia com o
 *                 remoto (ahead/behind) ou com branches órfãs para limpar.
 * - `clean`     — nada a fazer.
 */
export type RepoSeverityEntity = 'risk' | 'attention' | 'clean';

export type RepoCommitEntity = {
  commitHash: string;
  subject: string;
  author: string;
  /** Unix timestamp em segundos (committer date). */
  timestamp: number;
};

export type RepoBranchEntity = RepoCommitEntity & {
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
};

export type RepoWorktreeEntity = {
  staged: number;
  modified: number;
  untracked: number;
  conflicted: number;
  stashes: number;
};

export type RepoHeadEntity = RepoCommitEntity & {
  /** `null` quando o HEAD está detached ou o repositório não tem commits. */
  branch: string | null;
  detached: boolean;
};

export type RepoSyncEntity = {
  upstream: string | null;
  ahead: number;
  behind: number;
};

/** Branches que apontam para o mesmo commit, agrupadas para exibição. */
export type RepoCommitGroupEntity = RepoCommitEntity & {
  branches: string[];
};

export type RepoScanResultEntity = {
  path: string;
  name: string;
  /** Remote principal (`origin`), lido do `.git/config`. */
  remote: RepoRemoteEntity | null;
  /**
   * URL do site publicado deste projeto — o endereço que o usuário final
   * acessa, sem relação com o remote. Vem de `git config dlog.url` e já chega
   * validada como http/https. `null` quando não foi anotada.
   */
  appUrl: string | null;
  /** PRs conhecidos; preenchido só depois de um "Buscar do remoto". */
  prs: PullRequestEntity[];
  /** Branches locais cujo PR já foi mergeado — candidatas a apagar. */
  mergedBranchesToClean: string[];
  head: RepoHeadEntity | null;
  sync: RepoSyncEntity;
  worktree: RepoWorktreeEntity;
  branches: RepoBranchEntity[];
  groups: RepoCommitGroupEntity[];
  /** Nomes das branches locais que nunca foram publicadas. */
  unpublishedBranches: string[];
  /** Nomes das branches locais cujo upstream foi apagado no remoto. */
  goneBranches: string[];
  /** ISO date do último `git fetch` (mtime de `.git/FETCH_HEAD`), ou `null`. */
  lastFetchedAt: string | null;
  severity: RepoSeverityEntity;
  error?: string;
};

export type RepoFetchFailureEntity = {
  path: string;
  name: string;
  error: string;
};

export type RepoFetchResultEntity = {
  results: RepoScanResultEntity[];
  /** Falhas do `git fetch`. */
  failures: RepoFetchFailureEntity[];
  /** Falhas da consulta de pull requests. */
  prFailures: RepoFetchFailureEntity[];
};

/** O "Buscar do remoto" tem duas etapas de rede; a UI distingue as duas. */
export type FetchPhaseEntity = 'git' | 'prs';

export type RepoFetchProgressEntity = {
  phase: FetchPhaseEntity;
  done: number;
  total: number;
  /** Nome do repositório que acabou de ser processado. */
  current: string;
};
