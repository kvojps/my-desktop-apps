import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  description: string;
  action?: ReactNode;
  /**
   * `page`: a página inteira está vazia (ícone 48). `section`: é uma seção
   * ou tabela dentro de uma página com outro conteúdo (ícone 40). Ver
   * docs/design-system.md §5.4.
   */
  size?: 'page' | 'section';
}

/**
 * Lista vazia. Três partes sempre: ícone da própria tela, uma frase que diz
 * o que vai aparecer ali, e a ação primária — o mesmo botão do `PageHeader`,
 * repetido onde o olho já está (docs/design-system.md §5.4).
 */
export function EmptyState({ icon, description, action, size = 'page' }: EmptyStateProps) {
  return (
    <div className="orca:flex orca:flex-col orca:items-center orca:gap-3 orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:p-8 orca:text-center">
      <div
        aria-hidden
        className={`orca:text-muted-foreground ${size === 'page' ? 'orca:[&>svg]:size-12' : 'orca:[&>svg]:size-10'}`}
      >
        {icon}
      </div>
      <p className="orca:m-0 orca:text-sm orca:text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
