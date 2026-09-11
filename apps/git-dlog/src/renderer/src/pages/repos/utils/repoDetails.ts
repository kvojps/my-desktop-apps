import type { PullRequest } from '@shared/types/pullRequest';
import type { RepoScanResult } from '@shared/types/repoScan';
import { getCurrentBranchPr, getOpenPrs } from './pullRequest';

/**
 * As regras do painel de detalhes: qual é o estado de sincronia, o que a
 * working tree tem a dizer, quais branches sobraram e em que ordem os PRs
 * aparecem.
 *
 * Fica fora dos componentes pela mesma razão do `repoList.ts`: é aqui que mora
 * o comportamento, e é isto que a suíte pura alcança. Os componentes desenham
 * o que sai daqui — inclusive o tom, que é decisão de leitura e não de pintura.
 */

/**
 * Nenhum tom é o âmbar: `#fab219` como texto dá 1.83:1 sobre o papel claro
 * (design system §1.4, ADR-0001). O que sobra são três níveis, e a regra que
 * decide qual vale para cada pendência é uma só:
 *
 *   o tom espelha `summarizePendencies` — o que é risco na lista vira
 *   `emphasis` aqui, o que é neutro lá continua neutro —, e `danger` fica
 *   reservado aos dois casos em que o trabalho pode sumir de vez: conflito e
 *   trabalho que só existe nesta máquina.
 *
 * A lista e o painel descrevem o mesmo repositório; uma pendência que grita num
 * e sussurra no outro seria uma contradição entre as duas metades da tela.
 */
export type DetailTone = 'danger' | 'success' | 'emphasis' | 'neutral';

/** Cada contagem da working tree, na ordem em que o painel as mostra. */
export type WorktreeKey = 'conflicted' | 'staged' | 'modified' | 'untracked' | 'stashes';

export interface DetailItem {
  key: WorktreeKey;
  label: string;
  tone: DetailTone;
}

/**
 * Estado da branch atual em relação ao remoto. Os casos se excluem — é uma
 * resposta só — e a ordem em que são testados é a ordem em que fazem sentido:
 * num HEAD detached não há upstream a discutir, e num repositório sem commit
 * nenhum não há o que estar à frente ou atrás.
 */
export type SyncStateKind = 'detached' | 'no-commits' | 'no-upstream' | 'in-sync' | 'diverged';

export interface SyncState {
  kind: SyncStateKind;
  upstream: string | null;
  ahead: number;
  behind: number;
}

export function resolveSyncState(repo: RepoScanResult): SyncState {
  const { sync, head } = repo;
  const base = { upstream: sync.upstream, ahead: sync.ahead, behind: sync.behind };

  if (head?.detached) return { kind: 'detached', ...base };
  if (head && !head.commitHash) return { kind: 'no-commits', ...base };
  if (!sync.upstream) return { kind: 'no-upstream', ...base };
  if (sync.ahead === 0 && sync.behind === 0) return { kind: 'in-sync', ...base };
  return { kind: 'diverged', ...base };
}

function counted(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * O que existe na working tree e ainda não está em lugar nenhum além desta
 * máquina. Vazio quando não há nada — o painel é que diz "working tree limpa",
 * porque a ausência é uma frase, não um item.
 */
export function worktreeItems(repo: RepoScanResult): DetailItem[] {
  const { worktree } = repo;
  const items: DetailItem[] = [];

  if (worktree.conflicted > 0) {
    items.push({
      key: 'conflicted',
      label: `${worktree.conflicted} em conflito`,
      tone: 'danger',
    });
  }
  if (worktree.staged > 0) {
    items.push({ key: 'staged', label: `${worktree.staged} staged`, tone: 'emphasis' });
  }
  if (worktree.modified > 0) {
    items.push({
      key: 'modified',
      label: counted(worktree.modified, 'modificado', 'modificados'),
      tone: 'emphasis',
    });
  }
  if (worktree.untracked > 0) {
    items.push({
      key: 'untracked',
      label: counted(worktree.untracked, 'não rastreado', 'não rastreados'),
      tone: 'emphasis',
    });
  }
  if (worktree.stashes > 0) {
    items.push({
      key: 'stashes',
      label: counted(worktree.stashes, 'stash', 'stashes'),
      tone: 'emphasis',
    });
  }

  return items;
}

export interface BranchNotice {
  key: 'unpublished' | 'gone' | 'merged';
  /** Frase que explica o conjunto, já concordada com o número de branches. */
  label: string;
  branches: string[];
  tone: DetailTone;
}

/**
 * Branches que pedem alguma coisa: a que nunca saiu daqui, a que perdeu o
 * upstream e a que já foi mergeada. São três conjuntos disjuntos e cada um tem
 * um destino diferente — publicar, conferir, apagar.
 */
export function branchNotices(repo: RepoScanResult): BranchNotice[] {
  const notices: BranchNotice[] = [];

  if (repo.unpublishedBranches.length > 0) {
    notices.push({
      key: 'unpublished',
      label:
        repo.unpublishedBranches.length === 1
          ? 'Nunca publicada, só existe aqui'
          : 'Nunca publicadas, só existem aqui',
      branches: repo.unpublishedBranches,
      tone: 'danger',
    });
  }

  if (repo.goneBranches.length > 0) {
    notices.push({
      key: 'gone',
      label:
        repo.goneBranches.length === 1
          ? 'Upstream apagado no remoto, candidata a limpeza'
          : 'Upstream apagado no remoto, candidatas a limpeza',
      branches: repo.goneBranches,
      tone: 'neutral',
    });
  }

  if (repo.mergedBranchesToClean.length > 0) {
    notices.push({
      key: 'merged',
      label:
        repo.mergedBranchesToClean.length === 1
          ? 'PR já mergeado, pode ser apagada'
          : 'PR já mergeado, podem ser apagadas',
      branches: repo.mergedBranchesToClean,
      tone: 'neutral',
    });
  }

  return notices;
}

/**
 * Nomes das branches remotas. O agrupamento por commit carrega só nomes, e o
 * nome não diz de onde a branch veio: `feat/a` é local e tem barra igual a
 * `origin/main`. Quem sabe é a leitura do repositório.
 */
export function remoteBranchNames(repo: RepoScanResult): Set<string> {
  return new Set(repo.branches.filter((branch) => branch.isRemote).map((branch) => branch.name));
}

export function countBranches(repo: RepoScanResult): { local: number; remote: number } {
  const local = repo.branches.filter((branch) => !branch.isRemote).length;
  return { local, remote: repo.branches.length - local };
}

export interface OrderedPr {
  pr: PullRequest;
  /** O PR da branch em que se está agora — sobe para o topo e ganha destaque. */
  isCurrentBranch: boolean;
}

export function orderOpenPrs(repo: RepoScanResult): OrderedPr[] {
  const openPrs = getOpenPrs(repo);
  const current = getCurrentBranchPr(repo);
  const others = openPrs.filter((pr) => pr !== current);

  return [
    ...(current ? [{ pr: current, isCurrentBranch: true }] : []),
    ...others.map((pr) => ({ pr, isCurrentBranch: false })),
  ];
}
