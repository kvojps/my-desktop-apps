import type {
  ChecksStateEntity,
  PullRequestEntity,
  PullRequestStateEntity,
  ReviewDecisionEntity,
} from '../../../domain/pullRequest';
import { runCommand } from '../system/exec';

const PR_LIMIT = 50;
const TIMEOUT_MS = 30_000;

const JSON_FIELDS = [
  'number',
  'title',
  'url',
  'state',
  'isDraft',
  'headRefName',
  'baseRefName',
  'author',
  'reviewDecision',
  'updatedAt',
  'statusCheckRollup',
].join(',');

interface GhCheck {
  status?: string;
  conclusion?: string;
  state?: string;
}

interface GhPullRequest {
  number: number;
  title: string;
  url: string;
  state: string;
  isDraft: boolean;
  headRefName: string;
  baseRefName: string;
  author: { login?: string } | null;
  reviewDecision: string | null;
  updatedAt: string;
  statusCheckRollup: GhCheck[] | null;
}

export function normalizeState(raw: string): PullRequestStateEntity {
  const value = raw.toLowerCase();
  if (value === 'merged') return 'merged';
  if (value === 'closed') return 'closed';
  return 'open';
}

export function normalizeReviewDecision(raw: string | null | undefined): ReviewDecisionEntity {
  switch ((raw ?? '').toUpperCase()) {
    case 'APPROVED':
      return 'approved';
    case 'CHANGES_REQUESTED':
      return 'changes_requested';
    case 'REVIEW_REQUIRED':
      return 'review_required';
    default:
      return null;
  }
}

const FAILING_CONCLUSIONS = new Set([
  'FAILURE',
  'TIMED_OUT',
  'CANCELLED',
  'ACTION_REQUIRED',
  'ERROR',
]);

/**
 * Consolida a lista de checks num único estado. Falha domina pendente, que
 * domina sucesso — é a ordem em que a informação importa para quem olha.
 */
export function summarizeChecks(checks: GhCheck[] | null | undefined): ChecksStateEntity {
  if (!checks || checks.length === 0) return null;

  let pending = false;
  let sawSuccess = false;

  for (const check of checks) {
    // CheckRun usa status/conclusion; StatusContext usa state.
    const conclusion = (check.conclusion ?? check.state ?? '').toUpperCase();
    const status = (check.status ?? '').toUpperCase();

    if (FAILING_CONCLUSIONS.has(conclusion)) return 'failing';

    if (
      conclusion === 'PENDING' ||
      conclusion === 'EXPECTED' ||
      (status && status !== 'COMPLETED')
    ) {
      pending = true;
    } else if (conclusion === 'SUCCESS' || conclusion === 'NEUTRAL' || conclusion === 'SKIPPED') {
      sawSuccess = true;
    }
  }

  if (pending) return 'pending';
  return sawSuccess ? 'passing' : null;
}

/**
 * O mapper anticorrupção do `gh`: a forma que o GitHub devolve entra aqui e sai
 * como a forma de casa. É o ponto onde o vocabulário do provedor
 * (`headRefName`, `statusCheckRollup`) para — nada dele segue para o service.
 */
function ghPrToPullRequest(pr: GhPullRequest): PullRequestEntity {
  return {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    state: normalizeState(pr.state),
    isDraft: Boolean(pr.isDraft),
    headBranch: pr.headRefName,
    baseBranch: pr.baseRefName,
    author: pr.author?.login ?? '',
    reviewDecision: normalizeReviewDecision(pr.reviewDecision),
    checks: summarizeChecks(pr.statusCheckRollup),
    updatedAt: pr.updatedAt,
  };
}

export function parseGhOutput(stdout: string): PullRequestEntity[] {
  if (!stdout) return [];
  const parsed = JSON.parse(stdout) as GhPullRequest[];
  return Array.isArray(parsed) ? parsed.map(ghPrToPullRequest) : [];
}

/**
 * Lista PRs de todos os estados: os abertos mostram o que está em revisão, e os
 * mergeados são o que revela branches locais que já podem ser apagadas.
 */
export async function listPullRequestsWithGh(repoDir: string): Promise<PullRequestEntity[]> {
  const stdout = await runCommand(
    'gh',
    ['pr', 'list', '--state', 'all', '--limit', String(PR_LIMIT), '--json', JSON_FIELDS],
    { cwd: repoDir, timeoutMs: TIMEOUT_MS },
  );
  return parseGhOutput(stdout);
}
