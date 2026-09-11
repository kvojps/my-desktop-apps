import type { RepoScanResult, RepoSeverity } from '@shared/types/repoScan';
import { getOpenPrs, needsAction } from './pullRequest';

/**
 * A lógica da lista de repositórios: busca, filtros, desempate de nomes
 * repetidos, resumo das pendências e qual dos estados a tela deve mostrar.
 *
 * Fica fora dos componentes porque é o que muda de comportamento — e é o que a
 * suíte pura consegue verificar. Os componentes só desenham o que sai daqui.
 *
 * A **ordem** não está aqui: severidade é regra do domínio e quem ordena é o
 * main, em `sortBySeverity` (ADR-0003). O que sai daqui preserva a ordem em que
 * os resultados chegaram.
 */

export type RepoFilter = 'all' | RepoSeverity | 'error' | 'prAction' | 'prOpen';

/** Ordem dos chips de filtro, do mais para o menos urgente. */
export const REPO_FILTERS: { value: Exclude<RepoFilter, 'all'>; label: string }[] = [
  { value: 'risk', label: 'só nesta máquina' },
  { value: 'attention', label: 'fora de sincronia' },
  { value: 'prAction', label: 'PR pedindo ação' },
  { value: 'prOpen', label: 'com PR aberto' },
  { value: 'clean', label: 'sincronizados' },
  { value: 'error', label: 'com erro' },
];

export function searchRepos(repos: RepoScanResult[], search: string): RepoScanResult[] {
  const query = search.trim().toLowerCase();
  if (!query) return repos;
  return repos.filter(
    (repo) => repo.name.toLowerCase().includes(query) || repo.path.toLowerCase().includes(query),
  );
}

/** Cada filtro é um predicado sobre o repositório; a contagem e a lista usam o mesmo. */
export function matchesFilter(repo: RepoScanResult, filter: RepoFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'error':
      return Boolean(repo.error);
    case 'prAction':
      return !repo.error && repo.prs.some(needsAction);
    case 'prOpen':
      return !repo.error && getOpenPrs(repo).length > 0;
    default:
      return !repo.error && repo.severity === filter;
  }
}

/**
 * Contagem de cada filtro sobre o conjunto recebido — que é o resultado da
 * busca, e não o total. Os chips descrevem o que a pessoa consegue ver agora.
 */
export function countByFilter(repos: RepoScanResult[]): Record<RepoFilter, number> {
  const counts = {
    all: repos.length,
    risk: 0,
    attention: 0,
    clean: 0,
    error: 0,
    prAction: 0,
    prOpen: 0,
  } satisfies Record<RepoFilter, number>;

  for (const repo of repos) {
    for (const { value } of REPO_FILTERS) {
      if (matchesFilter(repo, value)) counts[value] += 1;
    }
  }

  return counts;
}

/** Segmentos do diretório que contém o repositório, sem o nome dele. */
function parentSegments(path: string): string[] {
  const segments = path.split(/[\\/]+/).filter(Boolean);
  return segments.slice(0, -1);
}

/**
 * Trecho de caminho que distingue repositórios de mesmo nome — o menor sufixo
 * do diretório-pai que já separa todos os homônimos. Nome único não recebe
 * trecho: a lista fica compacta, e o caminho completo está nos detalhes.
 */
export function buildPathHints(repos: RepoScanResult[]): Record<string, string> {
  const byName = new Map<string, RepoScanResult[]>();
  for (const repo of repos) {
    const group = byName.get(repo.name);
    if (group) group.push(repo);
    else byName.set(repo.name, [repo]);
  }

  const hints: Record<string, string> = {};

  for (const group of byName.values()) {
    if (group.length < 2) continue;

    const parents = group.map((repo) => parentSegments(repo.path));
    const deepest = Math.max(1, ...parents.map((segments) => segments.length));

    for (let depth = 1; depth <= deepest; depth += 1) {
      const candidates = parents.map((segments) => segments.slice(-depth).join('/'));
      const distinct = new Set(candidates).size === candidates.length;
      if (!distinct && depth < deepest) continue;

      group.forEach((repo, index) => {
        hints[repo.path] = candidates[index] || repo.path;
      });
      break;
    }
  }

  return hints;
}

/**
 * A seleção é por caminho, nunca por posição: depois de uma atualização o
 * repositório pode estar em outro lugar da lista, e o painel tem que continuar
 * descrevendo o mesmo repositório — ou nenhum.
 */
export function findByPath(repos: RepoScanResult[], path: string | null): RepoScanResult | null {
  if (!path) return null;
  return repos.find((repo) => repo.path === path) ?? null;
}

export interface RepoPendency {
  key: string;
  label: string;
  /** `risk` é o que só existe nesta máquina e o PR parado; o resto é neutro. */
  tone: 'risk' | 'neutral';
}

function counted(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Resumo das pendências de um repositório, na mesma ordem em que a severidade
 * do domínio as considera. É resumo: o detalhamento (quais branches, quais
 * arquivos, quais PRs) fica no painel de detalhes.
 */
export function summarizePendencies(repo: RepoScanResult): RepoPendency[] {
  if (repo.error) return [];

  const pendencies: RepoPendency[] = [];
  const { worktree, sync } = repo;
  const changed = worktree.staged + worktree.modified;

  if (worktree.conflicted > 0) {
    pendencies.push({
      key: 'conflicted',
      label: `${worktree.conflicted} em conflito`,
      tone: 'risk',
    });
  }
  if (changed > 0) {
    pendencies.push({
      key: 'changed',
      label: counted(changed, 'alterado', 'alterados'),
      tone: 'risk',
    });
  }
  if (worktree.untracked > 0) {
    pendencies.push({
      key: 'untracked',
      label: counted(worktree.untracked, 'não rastreado', 'não rastreados'),
      tone: 'risk',
    });
  }
  if (worktree.stashes > 0) {
    pendencies.push({
      key: 'stashes',
      label: counted(worktree.stashes, 'stash', 'stashes'),
      tone: 'risk',
    });
  }
  if (repo.unpublishedBranches.length > 0) {
    pendencies.push({
      key: 'unpublished',
      label: counted(
        repo.unpublishedBranches.length,
        'branch sem publicar',
        'branches sem publicar',
      ),
      tone: 'risk',
    });
  }

  if (repo.head?.detached) {
    pendencies.push({ key: 'detached', label: 'HEAD detached', tone: 'neutral' });
  }
  if (sync.ahead > 0) {
    pendencies.push({ key: 'ahead', label: `${sync.ahead} para enviar`, tone: 'neutral' });
  }
  if (sync.behind > 0) {
    pendencies.push({ key: 'behind', label: `${sync.behind} para receber`, tone: 'neutral' });
  }
  if (repo.goneBranches.length > 0) {
    pendencies.push({
      key: 'gone',
      label: counted(repo.goneBranches.length, 'branch sem remoto', 'branches sem remoto'),
      tone: 'neutral',
    });
  }
  if (repo.mergedBranchesToClean.length > 0) {
    pendencies.push({
      key: 'merged',
      label: counted(
        repo.mergedBranchesToClean.length,
        'branch para limpar',
        'branches para limpar',
      ),
      tone: 'neutral',
    });
  }

  const openPrs = getOpenPrs(repo);
  const prsNeedingAction = openPrs.filter(needsAction).length;
  if (prsNeedingAction > 0) {
    pendencies.push({
      key: 'prAction',
      label: `${counted(prsNeedingAction, 'PR', 'PRs')} pedindo ação`,
      tone: 'risk',
    });
  }
  const otherOpenPrs = openPrs.length - prsNeedingAction;
  if (otherOpenPrs > 0) {
    pendencies.push({
      key: 'prOpen',
      label: `${counted(otherOpenPrs, 'PR aberto', 'PRs abertos')}`,
      tone: 'neutral',
    });
  }

  return pendencies;
}

/**
 * `no-repos` é o estado que faltava: a varredura termina, não encontra
 * repositório nenhum dentro dos diretórios cadastrados, e a tela precisa dizer
 * isso em vez de continuar carregando.
 */
export type RepoListState = 'loading' | 'no-paths' | 'no-repos' | 'no-matches' | 'list';

export function resolveListState(input: {
  isLoadingScanPaths: boolean;
  hasScanPaths: boolean;
  /** Uma varredura já terminou nesta sessão. */
  hasScanned: boolean;
  totalRepos: number;
  visibleRepos: number;
}): RepoListState {
  if (input.isLoadingScanPaths) return 'loading';
  if (!input.hasScanPaths) return 'no-paths';
  if (!input.hasScanned) return 'loading';
  if (input.totalRepos === 0) return 'no-repos';
  if (input.visibleRepos === 0) return 'no-matches';
  return 'list';
}
