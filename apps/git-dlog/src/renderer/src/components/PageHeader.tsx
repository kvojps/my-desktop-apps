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
    <header className="orca:flex orca:flex-wrap orca:items-start orca:justify-between orca:gap-3">
      <div className="orca:flex orca:items-center orca:gap-3">
        {icon}
        <div>
          <h1 className="orca:m-0 orca:text-xl orca:font-bold orca:text-foreground">{title}</h1>
          {subtitle && (
            <p className="orca:mt-1 orca:mb-0 orca:text-sm orca:text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions}
    </header>
  );
}
