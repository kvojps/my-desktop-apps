import { CircleAlert, CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import type { RepoSeverity } from '@shared/types/repoScan';

export type BadgeLevel = RepoSeverity | 'error';

/**
 * Severidade em três canais: cor, ícone e palavra. A cor sozinha não serve
 * (design system §1.7), e em `attention` ela nem poderia ser texto — `#fab219`
 * dá 1.70:1 sobre o papel claro, então o âmbar só aparece como preenchimento
 * com rótulo preto (ADR-0001).
 */
const LEVELS: Record<BadgeLevel, { label: string; icon: typeof CircleAlert; className: string }> = {
  error: {
    label: 'erro',
    icon: CircleX,
    className: 'orca:bg-danger orca:text-on-color',
  },
  risk: {
    label: 'risco',
    icon: TriangleAlert,
    className: 'orca:bg-danger orca:text-on-color',
  },
  attention: {
    label: 'atenção',
    icon: CircleAlert,
    className: 'orca:bg-warning orca:text-on-warning',
  },
  clean: {
    label: 'limpo',
    icon: CircleCheck,
    className: 'orca:border orca:border-border orca:text-muted-foreground',
  },
};

export function SeverityBadge({ level }: { level: BadgeLevel }) {
  const { label, icon: Icon, className } = LEVELS[level];

  return (
    <span
      className={`orca:inline-flex orca:shrink-0 orca:items-center orca:gap-1 orca:rounded-md orca:px-1.5 orca:py-0.5 orca:text-xs orca:font-semibold ${className}`}
    >
      <Icon aria-hidden width={13} height={13} />
      {label}
    </span>
  );
}
