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
    <div className="orca:flex orca:h-screen orca:bg-background orca:text-foreground">
      <nav
        aria-label="Navegação principal"
        data-collapsed={collapsed}
        className="orca-sidebar orca:flex orca:shrink-0 orca:flex-col orca:gap-1 orca:bg-sidebar orca:p-3"
      >
        <div className="orca:mb-4 orca:flex orca:h-9 orca:items-center orca:gap-3 orca:px-1">
          <img src={logo32x32} alt="" width={28} height={28} />
          {!collapsed && <span className="orca:text-sm orca:font-semibold">Git Dlog</span>}
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
        <div id="primary-navigation" className="orca:mt-3 orca:flex orca:flex-col orca:gap-1">
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
          className="orca:mt-auto"
        >
          {mode === 'dark' ? <Sun /> : <Moon />}
          {!collapsed && <span>{mode === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>}
        </Button>
      </nav>
      <main className="orca-content orca:min-w-0 orca:flex-1 orca:overflow-y-auto orca:p-6">
        <div className="orca-shell orca:mx-auto orca:flex orca:max-w-[1440px] orca:flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
