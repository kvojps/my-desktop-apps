import {
  BarChartOutlined,
  DarkModeOutlined,
  DashboardOutlined,
  LightModeOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import { Box, ButtonBase, IconButton, Tooltip, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ROUTES } from '@/routes';

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  {
    label: 'Visão Geral',
    path: ROUTES.DASHBOARD,
    icon: <DashboardOutlined sx={{ fontSize: 18 }} />,
  },
  { label: 'Histórico', path: ROUTES.HISTORY, icon: <BarChartOutlined sx={{ fontSize: 18 }} /> },
  {
    label: 'Configurações',
    path: ROUTES.SETTINGS,
    icon: <SettingsOutlined sx={{ fontSize: 18 }} />,
  },
];

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
        <Tooltip title="Meu Dinheiro" placement="right">
          <Box
            component="img"
            src={logo}
            alt="Meu Dinheiro"
            onClick={() => navigate(ROUTES.DASHBOARD)}
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
            {mode === 'dark' ? (
              <LightModeOutlined fontSize="small" />
            ) : (
              <DarkModeOutlined fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Só o conteúdo rola, para o rail permanecer sempre alcançável. */}
      <Box component="main" sx={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {/* Em monitor largo o conteúdo para de crescer e centraliza: sem teto, o
            grid vira uma fileira de oito cards e ler uma linha da tabela exige
            varrer a tela.

            Os breakpoints do MUI medem a *janela*, mas o conteúdo mora numa
            faixa mais estreita: o rail, o padding e a barra de rolagem custam
            ~156px. Na largura mínima (960) sobram ~805px — ou seja, `md` (900)
            dispara quando não há espaço de `md`. Este container nomeado deixa os
            componentes consultarem a largura que realmente têm, via
            `@container content (min-width: …)`. */}
        <Box
          sx={{
            maxWidth: 1440,
            mx: 'auto',
            p: 3,
            containerType: 'inline-size',
            containerName: 'content',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
