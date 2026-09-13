import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconTile } from '@/components/IconTile';
import { Skeleton } from '@/components/Skeleton';
import type { TileAccent } from '@/theme/orca';

interface SectionHeaderProps {
  icon: LucideIcon;
  /**
   * Cor de identidade da seção. As seções que são operação, e não cadastro,
   * ficam neutras — é o que faz as outras quatro lerem como identidade (§1.5).
   */
  accent?: TileAccent;
  title: string;
  description: string;
  /** O id do título, para a seção se anunciar pelo que ela é. */
  titleId: string;
  /** Quantos registros a seção guarda. Ausente nas seções sem lista. */
  count?: number;
  loading?: boolean;
  /** Um segundo indicador da seção, como o total somado das contas. */
  extra?: ReactNode;
  /** A ação que cria o primeiro registro da seção. */
  action?: ReactNode;
}

/**
 * O cabeçalho da seção aberta: ladrilho, título, uma linha de explicação, a
 * contagem e a ação da seção. É o `PageHeader` um degrau abaixo — a tela já
 * declarou o seu assunto, e este declara o da seção.
 *
 * Enquanto a contagem carrega, um esqueleto do mesmo tamanho segura o lugar em
 * vez de exibir um `0` que ainda não é verdade (§5.3).
 */
export function SectionHeader({
  icon,
  accent,
  title,
  description,
  titleId,
  count,
  loading,
  extra,
  action,
}: SectionHeaderProps) {
  return (
    <header className="money-section-header">
      <IconTile icon={icon} accent={accent} />
      <div className="money-section-heading">
        <div className="money-section-title">
          <h2 id={titleId}>{title}</h2>
          {loading ? (
            <Skeleton variant="rounded" width={28} height={22} />
          ) : (
            count !== undefined && (
              <span className="money-chip" data-variant="outline">
                {count}
              </span>
            )
          )}
          {extra}
        </div>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
