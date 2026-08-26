import type { PullRequestEntity, RepoRemoteEntity } from '../../../domain/pullRequest';
import { AppError } from '../../../utils/errors/AppError';
import { normalizeReviewDecision, normalizeState, summarizeChecks } from './ghCli';

const PR_LIMIT = 50;
const TIMEOUT_MS = 30_000;

/**
 * GraphQL em vez de REST: a API REST de pulls não devolve resultado de revisão
 * nem status de CI, o que exigiria duas chamadas extras por PR. Aqui tudo vem
 * numa requisição só por repositório.
 */
const QUERY = `
query($owner: String!, $name: String!, $limit: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequests(first: $limit, orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes {
        number
        title
        url
        state
        isDraft
        updatedAt
        headRefName
        baseRefName
        author { login }
        reviewDecision
        commits(last: 1) {
          nodes { commit { statusCheckRollup { state } } }
        }
      }
    }
  }
}`;

interface GraphQlPr {
  number: number;
  title: string;
  url: string;
  state: string;
  isDraft: boolean;
  updatedAt: string;
  headRefName: string;
  baseRefName: string;
  author: { login?: string } | null;
  reviewDecision: string | null;
  commits: { nodes: { commit: { statusCheckRollup: { state?: string } | null } }[] };
}

interface GraphQlResponse {
  data?: { repository?: { pullRequests?: { nodes?: GraphQlPr[] } } };
  errors?: { message: string }[];
}

/** github.com usa api.github.com; instâncias Enterprise usam /api/graphql no próprio host. */
export function getGraphQlEndpoint(host: string): string {
  return host.toLowerCase() === 'github.com'
    ? 'https://api.github.com/graphql'
    : `https://${host}/api/graphql`;
}

/**
 * O mapper anticorrupção do GraphQL do GitHub. Faz o mesmo movimento do
 * `ghPrToPullRequest`, sobre a outra forma que o mesmo provedor devolve: aqui o
 * estado do CI vem enterrado no último commit, e é este mapper que o desenterra
 * antes que qualquer outra camada veja a árvore da consulta.
 */
function graphQlPrToPullRequest(pr: GraphQlPr): PullRequestEntity {
  const rollup = pr.commits.nodes[0]?.commit.statusCheckRollup;

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
    checks: summarizeChecks(rollup ? [{ state: rollup.state }] : null),
    updatedAt: pr.updatedAt,
  };
}

export async function listPullRequestsWithToken(
  remote: RepoRemoteEntity,
  token: string,
): Promise<PullRequestEntity[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(getGraphQlEndpoint(remote.host), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'git-dlog',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { owner: remote.owner, name: remote.repo, limit: PR_LIMIT },
      }),
      signal: controller.signal,
    });

    if (response.status === 401) {
      throw new AppError(401, 'Token do GitHub inválido ou expirado.');
    }
    if (response.status === 403) {
      throw new AppError(
        403,
        'Token sem permissão para este repositório (ou limite de uso atingido).',
      );
    }
    if (!response.ok) {
      throw new AppError(400, `GitHub respondeu ${response.status}.`);
    }

    const payload = (await response.json()) as GraphQlResponse;

    if (payload.errors?.length) {
      throw new AppError(400, payload.errors.map((error) => error.message).join('; '));
    }

    const nodes = payload.data?.repository?.pullRequests?.nodes ?? [];

    return nodes.map(graphQlPrToPullRequest);
  } finally {
    clearTimeout(timeout);
  }
}

/** Valida o token com uma chamada barata e devolve o login associado. */
export async function verifyGithubToken(token: string, host = 'github.com'): Promise<string> {
  const response = await fetch(getGraphQlEndpoint(host), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'git-dlog',
    },
    body: JSON.stringify({ query: '{ viewer { login } }' }),
  });

  if (!response.ok) {
    throw new AppError(
      response.status === 401 ? 401 : 400,
      response.status === 401 ? 'Token inválido.' : `GitHub respondeu ${response.status}.`,
    );
  }

  const payload = (await response.json()) as {
    data?: { viewer?: { login?: string } };
    errors?: { message: string }[];
  };

  if (payload.errors?.length) {
    throw new AppError(400, payload.errors.map((error) => error.message).join('; '));
  }

  const login = payload.data?.viewer?.login;
  if (!login) throw new AppError(400, 'Não foi possível identificar o usuário do token.');

  return login;
}
