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
    <li className="orca:space-y-1.5 orca:py-2">
      <div className="orca:flex orca:flex-wrap orca:items-center orca:gap-2">
        {isCurrentBranch && (
          <span className="orca:shrink-0 orca:rounded-md orca:bg-primary orca:px-1.5 orca:py-0.5 orca:text-xs orca:font-semibold orca:text-on-color">
            branch atual
          </span>
        )}
        <button
          type="button"
          onClick={() => void api.openExternal(pr.url)}
          title={`Abrir ${pr.url}`}
          className={`orca-link orca:min-w-0 orca:text-sm orca:break-words ${
            needsAction(pr) ? 'orca:font-bold' : 'orca:font-medium'
          }`}
        >
          #{pr.number} {pr.title}
          <ExternalLink
            aria-hidden
            width={12}
            height={12}
            className="orca:ml-1 orca:inline orca:align-middle"
          />
        </button>
      </div>

      <div className="orca:flex orca:flex-wrap orca:items-center orca:gap-x-2 orca:gap-y-1">
        {pr.isDraft && <StatusChip label="rascunho" icon={FilePen} />}
        {review && <StatusChip label={review.label} icon={review.icon} tone={review.tone} />}
        {checks && <StatusChip label={checks.label} icon={checks.icon} tone={checks.tone} />}
        <span
          className="orca:min-w-0 orca:truncate orca:font-mono orca:text-xs orca:text-muted-foreground"
          title={`De ${pr.headBranch} para ${pr.baseBranch}`}
        >
          {pr.headBranch} → {pr.baseBranch}
        </span>
        {pr.updatedAt && (
          <span className="orca:ml-auto orca:shrink-0 orca:text-xs orca:text-muted-foreground">
            {formatRelativeDate(pr.updatedAt)}
          </span>
        )}
      </div>
    </li>
  );
}
