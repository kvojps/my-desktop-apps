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
    <div className="ui:flex ui:flex-col ui:items-center ui:gap-3 ui:rounded-lg ui:border ui:border-border ui:bg-paper ui:p-8 ui:text-center">
      <div
        aria-hidden
        className={`ui:text-muted-foreground ${size === 'page' ? 'ui:[&>svg]:size-12' : 'ui:[&>svg]:size-10'}`}
      >
        {icon}
      </div>
      <p className="ui:m-0 ui:text-sm ui:text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
