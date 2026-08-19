import {
  AccountTreeOutlined,
  Brightness4,
  Brightness7,
  FolderOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import { Box, ButtonBase, IconButton, Tooltip } from '@mui/material';
import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo32x32 from '@/assets/logo-32x32.png';
import { useThemeMode } from '@/hooks/useThemeMode';
import { CONTROL_RADIUS } from '@/theme';
import { ROUTES } from '../../routes';

interface LayoutProps {
  children: ReactNode;
}

const APP_NAME = 'Git Dlog';

// Repositórios primeiro: é a tela inicial e o motivo de o app existir.
const NAV_ITEMS = [
  {
    label: 'Repositórios',
    path: ROUTES.REPOS,
    icon: <AccountTreeOutlined sx={{ fontSize: 22 }} />,
  },
  { label: 'Diretórios', path: ROUTES.DIRECTORIES, icon: <FolderOutlined sx={{ fontSize: 22 }} /> },
  {
    label: 'Configurações',
    path: ROUTES.SETTINGS,
    icon: <SettingsOutlined sx={{ fontSize: 22 }} />,
  },
];

/**
 * Largura de leitura. Sem o teto, num monitor wide os cards esticam por toda a
 * tela e a linha fica longa demais para varrer com o olho (docs/design-system.md §2.2/§4).
 */
const CONTENT_MAX_WIDTH = 1440;

const RAIL_WIDTH = 64;
const NAV_TILE_SIZE = 44;

/**
 * Rail de navegação fixo à esquerda, no lugar de uma barra superior. Num app
 * desktop a altura é o recurso escasso — a barra custava ~64px de conteúdo em
 * toda tela, enquanto o rail cobra largura, que sobra (a janela tem mínimo de
 * 960px). O rail também não rola junto com a página: só o conteúdo rola.
 *
 * Só ícone, sem rótulo visível (docs/design-system.md §4): rótulo de rail é a
 * tentação óbvia e é uma armadilha — para caber, ele desce a 10px, abaixo do
 * caption de 12px em que os limiares de contraste da §1 foram medidos. O nome
 * de cada item fica no `Tooltip` e no `aria-label`.
 */
export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box
        component="nav"
        aria-label="Navegação principal"
        sx={{
          width: RAIL_WIDTH,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          py: 2,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title={APP_NAME} placement="right">
          <Box
            component="img"
            src={logo32x32}
            alt={APP_NAME}
            onClick={() => navigate(ROUTES.REPOS)}
            sx={{
              width: 32,
              height: 32,
              borderRadius: `${CONTROL_RADIUS}px`,
              cursor: 'pointer',
              mb: 2,
            }}
          />
        </Tooltip>

        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Tooltip key={item.path} title={item.label} placement="right">
              <ButtonBase
                onClick={() => navigate(item.path)}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                sx={{
                  position: 'relative',
                  width: NAV_TILE_SIZE,
                  height: NAV_TILE_SIZE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: `${CONTROL_RADIUS}px`,
                  color: active ? 'primary.main' : 'text.secondary',
                  bgcolor: active ? 'action.selected' : 'transparent',
                  transition: (theme) =>
                    theme.transitions.create(['background-color', 'color'], {
                      duration: theme.transitions.duration.shortest,
                    }),
                  '&:hover': { bgcolor: 'action.hover' },
                  '&::before': active
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: -8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: '60%',
                        borderRadius: 999,
                        bgcolor: 'primary.main',
                      }
                    : undefined,
                }}
              >
                {item.icon}
              </ButtonBase>
            </Tooltip>
          );
        })}

        <Tooltip title="Alternar tema" placement="right">
          <IconButton onClick={toggleMode} aria-label="Alternar tema" sx={{ mt: 'auto' }}>
            {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Só o conteúdo rola, para o rail permanecer sempre alcançável. Também
          declara o contexto de container query da §2.2 do design system. */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          p: 3,
          containerType: 'inline-size',
          containerName: 'content',
        }}
      >
        <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
}
