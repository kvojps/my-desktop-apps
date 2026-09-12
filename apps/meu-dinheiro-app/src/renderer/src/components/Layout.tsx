import {
  ChartColumn,
  LayoutDashboard,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Button } from '@/components/Button';
import { useNavigationMemory } from '@/contexts/NavigationContext';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ROUTES } from '@/routes';

const NAV_ITEMS = [
  { label: 'Visão Geral', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Histórico', path: ROUTES.HISTORY, icon: ChartColumn },
  { label: 'Configurações', path: ROUTES.SETTINGS, icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();
  const { attachScroll, origin } = useNavigationMemory();
  const themeLabel = `Tema ${mode === 'dark' ? 'escuro' : 'claro'}. Ativar tema ${mode === 'dark' ? 'claro' : 'escuro'}`;
  // O detalhe de Mês pertence à origem da navegação, e é ela que a lateral
  // marca. Sem origem conhecida — uma rota de Mês aberta direto —, a origem é
  // a Visão Geral, como o retorno.
  const activePath = location.pathname.startsWith('/months/')
    ? origin === 'history'
      ? ROUTES.HISTORY
      : ROUTES.DASHBOARD
    : location.pathname;

  return (
    <div className="money-layout ui:flex ui:h-screen">
      <nav className="money-sidebar" data-collapsed={collapsed} aria-label="Navegação principal">
        <Link
          className="money-brand"
          to={ROUTES.DASHBOARD}
          aria-label="Meu Dinheiro — Visão Geral"
          title="Meu Dinheiro"
        >
          <img src={logo} alt="" width={28} height={28} />
          {!collapsed && <span>Meu Dinheiro</span>}
        </Link>
        <div id="main-navigation" className="ui:flex ui:flex-col ui:gap-1">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className="money-nav-item"
              aria-label={label}
              title={collapsed ? label : undefined}
              aria-current={activePath === path ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </div>
        <div className="money-sidebar-footer ui:flex ui:flex-col ui:gap-1">
          <Button variant="ghost" onClick={toggleMode} aria-label={themeLabel} title={themeLabel}>
            {mode === 'dark' ? (
              <Moon size={18} aria-hidden="true" />
            ) : (
              <Sun size={18} aria-hidden="true" />
            )}
            {!collapsed && <span>Tema {mode === 'dark' ? 'escuro' : 'claro'}</span>}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-controls="main-navigation"
            aria-label={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
            title={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={18} aria-hidden="true" />
            )}
            {!collapsed && <span>Recolher</span>}
          </Button>
        </div>
      </nav>
      {/* A faixa de conteúdo é quem rola, e por isso é ela que a sessão de
          navegação precisa conhecer para devolver a posição ao voltar. */}
      <main className="money-content ui:min-w-0 ui:flex-1 ui:overflow-y-auto" ref={attachScroll}>
        <div className="money-content-container">{children}</div>
      </main>
    </div>
  );
}
