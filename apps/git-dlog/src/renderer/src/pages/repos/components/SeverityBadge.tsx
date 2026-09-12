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
    className: 'ui:bg-danger ui:text-on-color',
  },
  risk: {
    label: 'risco',
    icon: TriangleAlert,
    className: 'ui:bg-danger ui:text-on-color',
  },
  attention: {
    label: 'atenção',
    icon: CircleAlert,
    className: 'ui:bg-warning ui:text-on-warning',
  },
  clean: {
    label: 'limpo',
    icon: CircleCheck,
    className: 'ui:border ui:border-border ui:text-muted-foreground',
  },
};

export function SeverityBadge({ level }: { level: BadgeLevel }) {
  const { label, icon: Icon, className } = LEVELS[level];

  return (
    <span
      className={`ui:inline-flex ui:shrink-0 ui:items-center ui:gap-1 ui:rounded-md ui:px-1.5 ui:py-0.5 ui:text-xs ui:font-semibold ${className}`}
    >
      <Icon aria-hidden width={13} height={13} />
      {label}
    </span>
  );
}
