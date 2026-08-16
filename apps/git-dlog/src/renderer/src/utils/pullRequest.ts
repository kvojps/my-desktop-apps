import type { PullRequest } from '@shared/types/pullRequest';
import type { RepoScanResult } from '@shared/types/repoScan';
import { api } from '@/api/client';

export function getOpenPrs(repo: RepoScanResult): PullRequest[] {
  return repo.prs.filter((pr) => pr.state === 'open');
}

/** O PR da branch em que você está agora — o mais relevante do repositório. */
export function getCurrentBranchPr(repo: RepoScanResult): PullRequest | null {
  if (!repo.head?.branch) return null;
  return getOpenPrs(repo).find((pr) => pr.headBranch === repo.head?.branch) ?? null;
}

/** PR aberto que está parado esperando algo de você: revisão negada ou CI vermelho. */
export function needsAction(pr: PullRequest): boolean {
  return (
    pr.state === 'open' && (pr.reviewDecision === 'changes_requested' || pr.checks === 'failing')
  );
}

export function countPrsNeedingAction(repos: RepoScanResult[]): number {
  return repos.reduce((total, repo) => total + repo.prs.filter(needsAction).length, 0);
}

export function countOpenPrs(repos: RepoScanResult[]): number {
  return repos.reduce((total, repo) => total + getOpenPrs(repo).length, 0);
}

export function openExternal(url: string): void {
  if (url) void api.openExternal(url);
}
