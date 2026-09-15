import {
  LayoutDashboard,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Settings,
  Sun,
  WalletCards,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/logo-128x128.png';
import { Tooltip } from '@/components/Tooltip';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ROUTES } from '@/routes';

const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Produtos', path: ROUTES.PRODUCTS, icon: Package },
  { label: 'Pedidos', path: ROUTES.ORDERS, icon: ReceiptText },
  { label: 'Vendas', path: ROUTES.SALES, icon: WalletCards },
  { label: 'Configurações', path: ROUTES.SETTINGS, icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();
  const themeLabel = `Tema ${mode === 'dark' ? 'escuro' : 'claro'}. Ativar tema ${mode === 'dark' ? 'claro' : 'escuro'}`;
  const collapsedTip = (label: string) => (collapsed ? label : '');

  return (
    <div className="ui:flex ui:h-screen ui:bg-background ui:text-foreground">
      <nav
        className="negocio-sidebar ui:flex ui:shrink-0 ui:flex-col ui:gap-1 ui:bg-sidebar ui:p-3"
        data-collapsed={collapsed}
        aria-label="Navegação principal"
      >
        {/* As dicas só existem recolhida; o título vazio as desliga sem
            remontar o gatilho, e o foco de quem recolheu fica onde estava. */}
        <Tooltip title={collapsedTip('Meu Negócio')} placement="right">
          <Link
            to={ROUTES.DASHBOARD}
            className="ui:mb-4 ui:flex ui:h-9 ui:items-center ui:gap-2 ui:px-1 ui:text-sm ui:font-semibold ui:text-foreground ui:no-underline"
            aria-label="Meu Negócio — Dashboard"
          >
            <img src={logo} alt="" width={28} height={28} />
            {!collapsed && (
              <>
                <span>Meu Negócio</span>
                <span className="negocio-chip" data-variant="outline">
                  v{__APP_VERSION__}
                </span>
              </>
            )}
          </Link>
        </Tooltip>
        <div id="main-navigation" className="ui:flex ui:flex-col ui:gap-1">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <Tooltip key={path} title={collapsedTip(label)} placement="right">
              <Link
                to={path}
                className="negocio-nav-item ui:px-3"
                aria-label={label}
                aria-current={location.pathname === path ? 'page' : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                {!collapsed && <span>{label}</span>}
              </Link>
            </Tooltip>
          ))}
        </div>
        <div className="ui:mt-auto ui:flex ui:flex-col ui:gap-1">
          <Tooltip title={collapsedTip(themeLabel)} placement="right">
            <button
              type="button"
              className="negocio-nav-item ui:w-full ui:px-3"
              onClick={toggleMode}
              aria-label={themeLabel}
            >
              {mode === 'dark' ? (
                <Sun size={18} aria-hidden="true" />
              ) : (
                <Moon size={18} aria-hidden="true" />
              )}
              {!collapsed && <span>Tema {mode === 'dark' ? 'escuro' : 'claro'}</span>}
            </button>
          </Tooltip>
          <Tooltip title={collapsedTip('Expandir navegação')} placement="right">
            <button
              type="button"
              className="negocio-nav-item ui:w-full ui:px-3"
              onClick={() => setCollapsed((value) => !value)}
              aria-expanded={!collapsed}
              aria-controls="main-navigation"
              aria-label={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={18} aria-hidden="true" />
              )}
              {!collapsed && <span>Recolher lateral</span>}
            </button>
          </Tooltip>
        </div>
      </nav>
      <main className="negocio-main ui:min-w-0 ui:flex-1 ui:overflow-y-auto ui:p-6">
        <div className="negocio-content ui:mx-auto ui:flex ui:min-h-full ui:max-w-[1440px] ui:flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
