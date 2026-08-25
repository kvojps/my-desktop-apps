import type { ChecksState, PullRequest, PullRequestState } from '@shared/types/pullRequest';
import { runCommand } from '../system/exec';

const MR_LIMIT = 50;
const TIMEOUT_MS = 30_000;

interface GlabMergeRequest {
  iid?: number;
  id?: number;
  title?: string;
  web_url?: string;
  state?: string;
  draft?: boolean;
  work_in_progress?: boolean;
  source_branch?: string;
  target_branch?: string;
  author?: { username?: string } | null;
  updated_at?: string;
  pipeline?: { status?: string } | null;
  head_pipeline?: { status?: string } | null;
}

function normalizeMrState(raw: string | undefined): PullRequestState {
  switch ((raw ?? '').toLowerCase()) {
    case 'merged':
      return 'merged';
    case 'closed':
    case 'locked':
      return 'closed';
    default:
      return 'open';
  }
}

function normalizePipeline(status: string | undefined): ChecksState {
  switch ((status ?? '').toLowerCase()) {
    case 'success':
      return 'passing';
    case 'failed':
    case 'canceled':
      return 'failing';
    case 'running':
    case 'pending':
    case 'created':
    case 'waiting_for_resource':
    case 'preparing':
      return 'pending';
    default:
      return null;
  }
}

export function parseGlabOutput(stdout: string): PullRequest[] {
  if (!stdout) return [];

  const parsed = JSON.parse(stdout) as GlabMergeRequest[];
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((mr) => mr.iid ?? mr.id)
    .map((mr) => ({
      number: (mr.iid ?? mr.id) as number,
      title: mr.title ?? '',
      url: mr.web_url ?? '',
      state: normalizeMrState(mr.state),
      isDraft: Boolean(mr.draft ?? mr.work_in_progress),
      headBranch: mr.source_branch ?? '',
      baseBranch: mr.target_branch ?? '',
      author: mr.author?.username ?? '',
      // A API de listagem do GitLab não devolve o resultado da revisão; sem
      // uma chamada por MR não dá para saber, e não vale o custo.
      reviewDecision: null,
      checks: normalizePipeline(mr.head_pipeline?.status ?? mr.pipeline?.status),
      updatedAt: mr.updated_at ?? '',
    }));
}

export async function listMergeRequestsWithGlab(repoDir: string): Promise<PullRequest[]> {
  const stdout = await runCommand(
    'glab',
    ['mr', 'list', '--all', '--output', 'json', '--per-page', String(MR_LIMIT)],
    { cwd: repoDir, timeoutMs: TIMEOUT_MS },
  );
  return parseGlabOutput(stdout);
}
