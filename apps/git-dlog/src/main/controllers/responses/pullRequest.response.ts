import type {
  PrIntegrationStatus,
  PrProviderStatus,
  PullRequest,
  RepoRemote,
} from '@shared/types/pullRequest';
import type {
  PrIntegrationStatusEntity,
  PrProviderStatusEntity,
  PullRequestEntity,
  RepoRemoteEntity,
} from '../../domain/pullRequest';

/**
 * `entity → response` do vocabulário de pull requests (README §2.5).
 *
 * Há um mapper por nó que é **objeto**, e só por eles. As uniões de literais
 * (`PullRequestStateEntity`, `ReviewDecisionEntity`, `ChecksStateEntity`,
 * `RemoteKindEntity`, `PrProviderKindEntity`) atravessam por atribuição direta,
 * e isso não é exceção à regra: uma variante nova de um lado quebra o `tsc` na
 * atribuição, que é a decisão que o mapper existiria para forçar. Com objeto é
 * o contrário — campo a mais na entidade continua atribuível ao contrato, e aí
 * o mapper é a única trava. É a linha que separa os dois casos neste arquivo e
 * no `repo.response.ts`.
 */
export function repoRemoteToResponse(entity: RepoRemoteEntity): RepoRemote {
  return {
    name: entity.name,
    url: entity.url,
    host: entity.host,
    owner: entity.owner,
    repo: entity.repo,
    webUrl: entity.webUrl,
    kind: entity.kind,
  };
}

export function pullRequestToResponse(entity: PullRequestEntity): PullRequest {
  return {
    number: entity.number,
    title: entity.title,
    url: entity.url,
    state: entity.state,
    isDraft: entity.isDraft,
    headBranch: entity.headBranch,
    baseBranch: entity.baseBranch,
    author: entity.author,
    reviewDecision: entity.reviewDecision,
    checks: entity.checks,
    updatedAt: entity.updatedAt,
  };
}

export function prProviderStatusToResponse(entity: PrProviderStatusEntity): PrProviderStatus {
  return {
    kind: entity.kind,
    available: entity.available,
    detail: entity.detail,
  };
}

export function prIntegrationStatusToResponse(
  entity: PrIntegrationStatusEntity,
): PrIntegrationStatus {
  return {
    providers: entity.providers.map(prProviderStatusToResponse),
    anyAvailable: entity.anyAvailable,
    hasGithubToken: entity.hasGithubToken,
  };
}
