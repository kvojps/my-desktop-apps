import {
  CircleAlert,
  CircleCheck,
  CircleX,
  ExternalLink,
  Eye,
  FilePen,
  Hourglass,
  type LucideIcon,
  UserCheck,
} from 'lucide-react';
import type { ChecksState, PullRequest, ReviewDecision } from '@shared/types/pullRequest';
import { api } from '@/api/client';
import { needsAction } from '@/pages/repos/utils/pullRequest';
import type { DetailTone } from '@/pages/repos/utils/repoDetails';
import { formatRelativeDate } from '@/utils/date';
import { StatusChip } from './StatusChip';

type ChipConfig = { tone: DetailTone; icon: LucideIcon; label: string };

const CHECKS: Record<NonNullable<ChecksState>, ChipConfig> = {
  passing: { tone: 'success', icon: CircleCheck, label: 'CI ok' },
  failing: { tone: 'danger', icon: CircleX, label: 'CI falhou' },
  pending: { tone: 'neutral', icon: Hourglass, label: 'CI rodando' },
};

const REVIEW: Record<NonNullable<ReviewDecision>, ChipConfig> = {
  approved: { tone: 'success', icon: UserCheck, label: 'aprovado' },
  changes_requested: { tone: 'danger', icon: CircleAlert, label: 'mudanças pedidas' },
  review_required: { tone: 'neutral', icon: Eye, label: 'aguardando revisão' },
};

/**
 * Um PR aberto. O da branch atual vem primeiro (`orderOpenPrs`) e se anuncia
 * com uma etiqueta, não com fundo: cor de texto sobre o `accent` claro perde AA
 * (design system §1.1), e a etiqueta preenchida é destaque que sobrevive à
 * ausência de cor — posição, palavra e peso dizem o mesmo.
 */
export function PullRequestRow({
  pr,
  isCurrentBranch = false,
}: {
  pr: PullRequest;
  isCurrentBranch?: boolean;
}) {
  const review = pr.reviewDecision ? REVIEW[pr.reviewDecision] : null;
  const checks = pr.checks ? CHECKS[pr.checks] : null;

  return (
    <li className="ui:space-y-1.5 ui:py-2">
      <div className="ui:flex ui:flex-wrap ui:items-center ui:gap-2">
        {isCurrentBranch && (
          <span className="ui:shrink-0 ui:rounded-md ui:bg-primary ui:px-1.5 ui:py-0.5 ui:text-xs ui:font-semibold ui:text-on-color">
            branch atual
          </span>
        )}
        <button
          type="button"
          onClick={() => void api.openExternal(pr.url)}
          title={`Abrir ${pr.url}`}
          className={`ui-link ui:min-w-0 ui:text-sm ui:break-words ${
            needsAction(pr) ? 'ui:font-bold' : 'ui:font-medium'
          }`}
        >
          #{pr.number} {pr.title}
          <ExternalLink
            aria-hidden
            width={12}
            height={12}
            className="ui:ml-1 ui:inline ui:align-middle"
          />
        </button>
      </div>

      <div className="ui:flex ui:flex-wrap ui:items-center ui:gap-x-2 ui:gap-y-1">
        {pr.isDraft && <StatusChip label="rascunho" icon={FilePen} />}
        {review && <StatusChip label={review.label} icon={review.icon} tone={review.tone} />}
        {checks && <StatusChip label={checks.label} icon={checks.icon} tone={checks.tone} />}
        <span
          className="ui:min-w-0 ui:truncate ui:font-mono ui:text-xs ui:text-muted-foreground"
          title={`De ${pr.headBranch} para ${pr.baseBranch}`}
        >
          {pr.headBranch} → {pr.baseBranch}
        </span>
        {pr.updatedAt && (
          <span className="ui:ml-auto ui:shrink-0 ui:text-xs ui:text-muted-foreground">
            {formatRelativeDate(pr.updatedAt)}
          </span>
        )}
      </div>
    </li>
  );
}
