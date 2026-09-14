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

  return (
    <div className="ui:flex ui:h-screen ui:bg-background ui:text-foreground">
      <nav
        className="negocio-sidebar ui:flex ui:shrink-0 ui:flex-col ui:gap-1 ui:bg-sidebar ui:p-3"
        data-collapsed={collapsed}
        aria-label="Navegação principal"
      >
        <Link
          to={ROUTES.DASHBOARD}
          className="ui:mb-4 ui:flex ui:h-9 ui:items-center ui:gap-2 ui:px-1 ui:text-sm ui:font-semibold ui:text-foreground"
          aria-label="Meu Negócio — Dashboard"
          title="Meu Negócio"
        >
          <img src={logo} alt="" width={28} height={28} />
          {!collapsed && <span>Meu Negócio</span>}
        </Link>
        <div id="main-navigation" className="ui:flex ui:flex-col ui:gap-1">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className="negocio-nav-item ui:px-3"
              aria-label={label}
              data-tooltip={collapsed ? label : undefined}
              aria-current={location.pathname === path ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </div>
        <div className="ui:mt-auto ui:flex ui:flex-col ui:gap-1">
          <button
            type="button"
            className="negocio-nav-item ui:w-full ui:px-3"
            onClick={toggleMode}
            aria-label={themeLabel}
            data-tooltip={collapsed ? themeLabel : undefined}
          >
            {mode === 'dark' ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
            {!collapsed && <span>Tema {mode === 'dark' ? 'escuro' : 'claro'}</span>}
          </button>
          <button
            type="button"
            className="negocio-nav-item ui:w-full ui:px-3"
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
            aria-controls="main-navigation"
            aria-label={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
            data-tooltip={collapsed ? 'Expandir navegação' : undefined}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={18} aria-hidden="true" />
            )}
            {!collapsed && <span>Recolher lateral</span>}
          </button>
        </div>
      </nav>
      <main className="ui:min-w-0 ui:flex-1 ui:overflow-y-auto ui:p-6">
        <div className="negocio-content ui:mx-auto ui:flex ui:min-h-full ui:max-w-[1440px] ui:flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
