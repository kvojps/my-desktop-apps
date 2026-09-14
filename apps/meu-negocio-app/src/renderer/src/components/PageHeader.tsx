import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /**
   * Ação primária da tela e os controles que valem para ela inteira — o filtro
   * de período do Dashboard mora aqui, e não numa faixa própria: ele governa
   * tudo que está abaixo, e é aqui que o escopo da página é declarado.
   */
  actions?: ReactNode;
}

/**
 * Topo de toda tela: ícone, título, subtítulo e ações. Sem margem própria — o
 * espaçamento vertical é do `.negocio-page`, como entre todas as outras seções
 * (§3.1). O ícone pode ser Lucide ou MUI enquanto as duas bases convivem: quem
 * manda no tamanho e na cor é o CSS do cabeçalho.
 */
export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="negocio-page-header">
      <div className="negocio-page-heading">
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
