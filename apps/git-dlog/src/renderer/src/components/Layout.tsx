import {
  Folder,
  GitBranch,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo32x32 from '@/assets/logo-32x32.png';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ROUTES } from '@/routes';
import { Button } from './Button';

const NAV_ITEMS = [
  { label: 'Repositórios', path: ROUTES.REPOS, icon: GitBranch },
  { label: 'Diretórios', path: ROUTES.DIRECTORIES, icon: Folder },
  { label: 'Configurações', path: ROUTES.SETTINGS, icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { mode, toggleMode } = useThemeMode();
  const collapseLabel = collapsed ? 'Expandir navegação' : 'Recolher navegação';
  const themeLabel = mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';

  return (
    <div className="ui:flex ui:h-screen ui:bg-background ui:text-foreground">
      <nav
        aria-label="Navegação principal"
        data-collapsed={collapsed}
        className="ui-sidebar ui:flex ui:shrink-0 ui:flex-col ui:gap-1 ui:bg-sidebar ui:p-3"
      >
        <div className="ui:mb-4 ui:flex ui:h-9 ui:items-center ui:gap-3 ui:px-1">
          <img src={logo32x32} alt="" width={28} height={28} />
          {!collapsed && <span className="ui:text-sm ui:font-semibold">Git Dlog</span>}
        </div>
        <Button
          variant="nav"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapseLabel}
          aria-expanded={!collapsed}
          aria-controls="primary-navigation"
          title={collapseLabel}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          {!collapsed && <span>Recolher lateral</span>}
        </Button>
        <div id="primary-navigation" className="ui:mt-3 ui:flex ui:flex-col ui:gap-1">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <Button key={path} asChild variant="nav">
              <NavLink to={path} aria-label={label} title={collapsed ? label : undefined}>
                <Icon />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            </Button>
          ))}
        </div>
        <Button
          variant="nav"
          onClick={toggleMode}
          aria-label={themeLabel}
          title={themeLabel}
          className="ui:mt-auto"
        >
          {mode === 'dark' ? <Sun /> : <Moon />}
          {!collapsed && <span>{mode === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>}
        </Button>
      </nav>
      <main className="ui-content ui:min-w-0 ui:flex-1 ui:overflow-y-auto ui:p-6">
        <div className="ui-shell ui:mx-auto ui:flex ui:max-w-[1440px] ui:flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
