import fs from 'node:fs/promises';
import path from 'node:path';
// `isWorktreeDirty` é o único helper que este gateway busca no contrato em vez
// do domínio, e é exceção nomeada: ele descreve uma working tree em vez de
// decidir alguma coisa sobre ela, então mora em `shared` e é chamado também
// pelo renderer. Ver `docs/adr/0003-logica-de-dominio-no-main.md`.
//
// O preço da exceção é uma travessia silenciosa: `computeSeverity` entrega um
// `RepoWorktreeEntity` a um parâmetro `RepoWorktree`, e só typecheca porque as
// duas formas são idênticas hoje. Se `RepoWorktree` mudar sem a entidade
// mudar junto, é aqui que ninguém vai ser avisado.
import { isWorktreeDirty } from '@shared/types/repoScan';
import type { RepoRemoteEntity } from '../../../domain/pullRequest';
import type {
  RepoBranchEntity,
  RepoCommitGroupEntity,
  RepoHeadEntity,
  RepoScanResultEntity,
  RepoSeverityEntity,
  RepoSyncEntity,
  RepoWorktreeEntity,
} from '../../../domain/repo';
import { mapWithConcurrency } from '../../../utils/concurrency';
import { getGitErrorMessage, runGit } from './gitCommand';
import { readRemotes, readRepoConfig } from './remoteUrl';

// Diretórios que não valem a pena descer: nunca contêm repositórios que
// interessam e custam caro em I/O. `.git` já foi identificado pelo pai.
const EXCLUDED_DIR_NAMES = new Set([
  '.git',
  'node_modules',
  'vendor',
  'dist',
  'build',
  'out',
  'target',
  '.venv',
  'venv',
  '__pycache__',
  '.next',
  '.nuxt',
  '.cache',
  '.gradle',
  'Pods',
]);

// Profundidade máxima a partir de cada diretório-base. Protege contra árvores
// gigantes e contra links que criem ciclos.
const MAX_WALK_DEPTH = 10;

const SCAN_CONCURRENCY = 8;

// Separador dos campos do for-each-ref. O assunto do commit vai por último
// justamente porque é o único campo que pode conter TAB.
const FIELD_SEP = '\t';

const REF_FORMAT = [
  '%(refname)',
  '%(refname:short)',
  '%(objectname:short)',
  '%(committerdate:unix)',
  '%(upstream:short)',
  '%(upstream:track)',
  '%(authorname)',
  '%(contents:subject)',
].join(FIELD_SEP);

export async function findGitRepos(baseDir: string): Promise<string[]> {
  const repos: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    let entries: import('node:fs').Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    if (entries.some((entry) => entry.name === '.git')) {
      repos.push(dir);
    }

    if (depth >= MAX_WALK_DEPTH) return;

    const subDirs = entries.filter(
      (entry) => entry.isDirectory() && !EXCLUDED_DIR_NAMES.has(entry.name),
    );

    await Promise.all(subDirs.map((entry) => walk(path.join(dir, entry.name), depth + 1)));
  }

  await walk(baseDir, 0);
  return repos;
}

/** Lista, sem duplicatas, todos os repositórios sob os diretórios-base. */
export async function listRepoDirs(baseDirs: string[]): Promise<string[]> {
  const repoDirsPerBase = await Promise.all(baseDirs.map((baseDir) => findGitRepos(baseDir)));
  return Array.from(new Set(repoDirsPerBase.flat().map((repoDir) => path.resolve(repoDir))));
}

interface ParsedStatus {
  branch: string | null;
  detached: boolean;
  sync: RepoSyncEntity;
  counts: Omit<RepoWorktreeEntity, 'stashes'>;
}

/**
 * Interpreta a saída de `git status --porcelain=v2 --branch`.
 *
 * Formato: linhas `# branch.*` com o cabeçalho, depois uma linha por arquivo —
 * `1`/`2` para alterações rastreadas (o campo XY diz se a mudança está no index
 * ou na working tree), `u` para conflitos e `?` para não rastreados.
 */
function parseStatus(output: string): ParsedStatus {
  const parsed: ParsedStatus = {
    branch: null,
    detached: false,
    sync: { upstream: null, ahead: 0, behind: 0 },
    counts: { staged: 0, modified: 0, untracked: 0, conflicted: 0 },
  };

  for (const line of output.split('\n')) {
    if (!line) continue;

    if (line.startsWith('# branch.head ')) {
      const value = line.slice('# branch.head '.length).trim();
      if (value === '(detached)') {
        parsed.detached = true;
      } else {
        parsed.branch = value;
      }
    } else if (line.startsWith('# branch.upstream ')) {
      parsed.sync.upstream = line.slice('# branch.upstream '.length).trim();
    } else if (line.startsWith('# branch.ab ')) {
      const match = line.match(/\+(\d+)\s+-(\d+)/);
      if (match) {
        parsed.sync.ahead = Number(match[1]);
        parsed.sync.behind = Number(match[2]);
      }
    } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
      const xy = line.slice(2, 4);
      if (xy[0] !== '.') parsed.counts.staged++;
      if (xy[1] !== '.') parsed.counts.modified++;
    } else if (line.startsWith('u ')) {
      parsed.counts.conflicted++;
    } else if (line.startsWith('? ')) {
      parsed.counts.untracked++;
    }
  }

  return parsed;
}

/** `[ahead 2, behind 1]`, `[gone]` ou vazio — como o git devolve em `upstream:track`. */
function parseTrack(track: string): { ahead: number; behind: number; gone: boolean } {
  if (track.includes('gone')) {
    return { ahead: 0, behind: 0, gone: true };
  }
  return {
    ahead: Number(/ahead (\d+)/.exec(track)?.[1] ?? 0),
    behind: Number(/behind (\d+)/.exec(track)?.[1] ?? 0),
    gone: false,
  };
}

function parseRefs(output: string): RepoBranchEntity[] {
  const branches: RepoBranchEntity[] = [];

  for (const line of output.split('\n')) {
    if (!line) continue;

    const parts = line.split(FIELD_SEP);
    if (parts.length < 8) continue;

    const [fullName, name, commitHash, dateRaw, upstreamRaw, trackRaw, author, ...subjectParts] =
      parts;

    // `origin/HEAD` é só um ponteiro simbólico para a branch default do remoto;
    // listá-lo duplicaria a informação em toda a interface.
    if (/^refs\/remotes\/[^/]+\/HEAD$/.test(fullName)) continue;

    const isRemote = fullName.startsWith('refs/remotes/');
    const { ahead, behind, gone } = parseTrack(trackRaw);
    const upstream = upstreamRaw || null;

    branches.push({
      name,
      isRemote,
      commitHash,
      subject: subjectParts.join(FIELD_SEP),
      author,
      timestamp: Number(dateRaw) || 0,
      upstream,
      ahead,
      behind,
      gone,
      unpublished: !isRemote && !upstream,
    });
  }

  return branches;
}

function groupBranchesByCommit(branches: RepoBranchEntity[]): RepoCommitGroupEntity[] {
  const groupsByHash = new Map<string, RepoCommitGroupEntity>();

  for (const branch of branches) {
    let group = groupsByHash.get(branch.commitHash);
    if (!group) {
      group = {
        commitHash: branch.commitHash,
        subject: branch.subject,
        author: branch.author,
        timestamp: branch.timestamp,
        branches: [],
      };
      groupsByHash.set(branch.commitHash, group);
    }
    group.branches.push(branch.name);
  }

  return Array.from(groupsByHash.values())
    .map((group) => ({ ...group, branches: [...group.branches].sort() }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

function computeSeverity(
  worktree: RepoWorktreeEntity,
  sync: RepoSyncEntity,
  unpublishedBranches: string[],
  goneBranches: string[],
  head: RepoHeadEntity | null,
): RepoSeverityEntity {
  // Risco = existe trabalho que só está nesta máquina.
  if (isWorktreeDirty(worktree) || worktree.stashes > 0 || unpublishedBranches.length > 0) {
    return 'risk';
  }
  // HEAD detached não perde trabalho por si só, mas commits feitos aí ficam sem
  // branch e somem no próximo checkout — sempre vale um aviso.
  if (sync.ahead > 0 || sync.behind > 0 || goneBranches.length > 0 || head?.detached) {
    return 'attention';
  }
  return 'clean';
}

/**
 * Resolve o diretório do git, que nem sempre é `<repo>/.git`: em worktrees e
 * submódulos o `.git` é um arquivo apontando para outro lugar.
 */
async function resolveGitDir(repoDir: string): Promise<string> {
  const gitPath = path.join(repoDir, '.git');
  const stat = await fs.stat(gitPath);
  if (stat.isDirectory()) return gitPath;

  const content = await fs.readFile(gitPath, 'utf8');
  const target = content.match(/^gitdir:\s*(.+)$/m)?.[1]?.trim();
  if (!target) return gitPath;

  return path.isAbsolute(target) ? target : path.resolve(repoDir, target);
}

/**
 * O git reescreve `FETCH_HEAD` a cada fetch bem-sucedido, mesmo quando nada
 * mudou — então o mtime desse arquivo é o "último contato com o remoto",
 * inclusive para fetches feitos fora do app.
 */
async function readLastFetchedAt(gitDir: string): Promise<string | null> {
  try {
    const stat = await fs.stat(path.join(gitDir, 'FETCH_HEAD'));
    return stat.mtime.toISOString();
  } catch {
    return null;
  }
}

interface GitDirInfo {
  lastFetchedAt: string | null;
  remote: RepoRemoteEntity | null;
  appUrl: string | null;
}

/** Tudo que sai do diretório `.git` sem custar um processo novo. */
async function readGitDirInfo(repoDir: string): Promise<GitDirInfo> {
  try {
    const gitDir = await resolveGitDir(repoDir);
    const [lastFetchedAt, config] = await Promise.all([
      readLastFetchedAt(gitDir),
      readRepoConfig(gitDir),
    ]);
    return { lastFetchedAt, remote: config.remote, appUrl: config.appUrl };
  } catch {
    return { lastFetchedAt: null, remote: null, appUrl: null };
  }
}

/** `true` se o repositório tem ao menos um remote configurado. */
export async function hasAnyRemote(repoDir: string): Promise<boolean> {
  try {
    return (await readRemotes(await resolveGitDir(repoDir))).size > 0;
  } catch {
    return false;
  }
}

function emptyResult(repoDir: string, error?: string): RepoScanResultEntity {
  return {
    path: repoDir,
    name: path.basename(repoDir),
    remote: null,
    appUrl: null,
    prs: [],
    mergedBranchesToClean: [],
    head: null,
    sync: { upstream: null, ahead: 0, behind: 0 },
    worktree: { staged: 0, modified: 0, untracked: 0, conflicted: 0, stashes: 0 },
    branches: [],
    groups: [],
    unpublishedBranches: [],
    goneBranches: [],
    lastFetchedAt: null,
    severity: 'clean',
    error,
  };
}

/**
 * Lê o estado completo de um repositório com três chamadas ao git, todas em
 * paralelo — antes era uma chamada de `rev-parse` e duas de `log` por branch.
 */
export async function scanRepo(repoDir: string): Promise<RepoScanResultEntity> {
  try {
    const [statusOutput, refsOutput, stashOutput, gitDirInfo] = await Promise.all([
      runGit(repoDir, ['status', '--porcelain=v2', '--branch']),
      runGit(repoDir, ['for-each-ref', `--format=${REF_FORMAT}`, 'refs/heads', 'refs/remotes']),
      // Repositório sem nenhum stash ainda pode não ter a ref; erro aqui é
      // esperado e significa zero.
      runGit(repoDir, ['stash', 'list']).catch(() => ''),
      readGitDirInfo(repoDir),
    ]);

    const status = parseStatus(statusOutput);
    const branches = parseRefs(refsOutput);

    const worktree: RepoWorktreeEntity = {
      ...status.counts,
      stashes: stashOutput ? stashOutput.split('\n').filter(Boolean).length : 0,
    };

    const localBranches = branches.filter((branch) => !branch.isRemote);
    const unpublishedBranches = localBranches
      .filter((branch) => branch.unpublished)
      .map((branch) => branch.name);
    const goneBranches = localBranches.filter((branch) => branch.gone).map((branch) => branch.name);

    const head = buildHead(status, branches);

    return {
      path: repoDir,
      name: path.basename(repoDir),
      remote: gitDirInfo.remote,
      appUrl: gitDirInfo.appUrl,
      prs: [],
      mergedBranchesToClean: [],
      head,
      sync: status.sync,
      worktree,
      branches,
      groups: groupBranchesByCommit(branches),
      unpublishedBranches,
      goneBranches,
      lastFetchedAt: gitDirInfo.lastFetchedAt,
      severity: computeSeverity(worktree, status.sync, unpublishedBranches, goneBranches, head),
    };
  } catch (err) {
    return emptyResult(repoDir, getGitErrorMessage(err, 'Erro desconhecido ao escanear.'));
  }
}

function buildHead(status: ParsedStatus, branches: RepoBranchEntity[]): RepoHeadEntity | null {
  if (status.branch) {
    const current = branches.find((branch) => !branch.isRemote && branch.name === status.branch);
    if (current) {
      return {
        branch: current.name,
        detached: false,
        commitHash: current.commitHash,
        subject: current.subject,
        author: current.author,
        timestamp: current.timestamp,
      };
    }
    // Branch recém-criada sem commits: existe no HEAD mas não em refs/heads.
    return {
      branch: status.branch,
      detached: false,
      commitHash: '',
      subject: '',
      author: '',
      timestamp: 0,
    };
  }

  if (status.detached) {
    return { branch: null, detached: true, commitHash: '', subject: '', author: '', timestamp: 0 };
  }

  return null;
}

export async function scanRepos(repoDirs: string[]): Promise<RepoScanResultEntity[]> {
  const results = await mapWithConcurrency(repoDirs, SCAN_CONCURRENCY, scanRepo);
  return sortBySeverity(results);
}

const SEVERITY_ORDER: Record<RepoSeverityEntity, number> = { risk: 0, attention: 1, clean: 2 };

/** Mais urgente primeiro; empate resolvido pelo nome para a lista não "dançar". */
function sortBySeverity(results: RepoScanResultEntity[]): RepoScanResultEntity[] {
  return [...results].sort((a, b) => {
    if (a.error && !b.error) return -1;
    if (!a.error && b.error) return 1;
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    return bySeverity !== 0 ? bySeverity : a.name.localeCompare(b.name, 'pt-BR');
  });
}
