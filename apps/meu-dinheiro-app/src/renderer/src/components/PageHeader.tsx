import { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Topo de toda tela: ícone, título, subtítulo e as ações que valem para a tela
 * inteira. Sem margem própria — o espaçamento vertical é do `.money-page`,
 * como entre todas as outras seções (§3.1).
 */
export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="money-page-header">
      <div className="money-page-heading">
        {icon}
        <div className="ui:min-w-0">
          <h1 title={title}>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions}
    </header>
  );
}
