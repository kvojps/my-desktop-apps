import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Topo de toda página: ícone + título + subtítulo + ações. Sem margem
 * própria — o espaçamento vertical é do `Stack` da página (docs/design-system.md §3.1).
 */
export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="ui:flex ui:flex-wrap ui:items-start ui:justify-between ui:gap-3">
      <div className="ui:flex ui:items-center ui:gap-3">
        {icon}
        <div>
          <h1 className="ui:m-0 ui:text-xl ui:font-bold ui:text-foreground">{title}</h1>
          {subtitle && (
            <p className="ui:mt-1 ui:mb-0 ui:text-sm ui:text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions}
    </header>
  );
}
