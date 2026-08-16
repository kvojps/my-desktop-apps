import {
  AccountTreeOutlined,
  Brightness4,
  Brightness7,
  FolderOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import { Box, ButtonBase, IconButton, Tooltip, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo32x32 from '@/assets/logo-32x32.png';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ROUTES } from '../../routes';

interface LayoutProps {
  children: ReactNode;
}

const APP_NAME = 'Git Dlog';

// Repositórios primeiro: é a tela inicial e o motivo de o app existir.
const NAV_ITEMS = [
  { label: 'Repositórios', path: ROUTES.REPOS, icon: <AccountTreeOutlined /> },
  { label: 'Diretórios', path: ROUTES.DIRECTORIES, icon: <FolderOutlined /> },
  { label: 'Configurações', path: ROUTES.SETTINGS, icon: <SettingsOutlined /> },
];

/**
 * Largura de leitura. Sem o teto, num monitor wide os cards esticam por toda a
 * tela e a linha fica longa demais para varrer com o olho.
 */
const CONTENT_MAX_WIDTH = 1100;

const RAIL_WIDTH = 92;

/**
 * Rail de navegação fixo à esquerda, no lugar de uma barra superior. Num app
 * desktop a altura é o recurso escasso — a barra custava ~64px de conteúdo em
 * toda tela, enquanto o rail cobra largura, que sobra (a janela tem mínimo de
 * 960px). O rail também não rola junto com a página: só o conteúdo rola.
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
            sx={{ width: 32, height: 32, borderRadius: 1, cursor: 'pointer', mb: 2 }}
          />
        </Tooltip>

        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ButtonBase
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              sx={{
                width: 76,
                py: 1,
                px: 0.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                borderRadius: 2,
                color: active ? 'primary.main' : 'text.secondary',
                bgcolor: active ? 'action.selected' : 'transparent',
                transition: (theme) =>
                  theme.transitions.create(['background-color', 'color'], {
                    duration: theme.transitions.duration.shortest,
                  }),
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {item.icon}
              <Typography
                variant="caption"
                sx={{
                  fontSize: 10,
                  lineHeight: 1.2,
                  textAlign: 'center',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {item.label}
              </Typography>
            </ButtonBase>
          );
        })}

        <Tooltip title="Alternar tema" placement="right">
          <IconButton onClick={toggleMode} aria-label="Alternar tema" sx={{ mt: 'auto' }}>
            {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Só o conteúdo rola, para o rail permanecer sempre alcançável. */}
      <Box component="main" sx={{ flex: 1, minWidth: 0, overflowY: 'auto', p: 3 }}>
        <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
}
