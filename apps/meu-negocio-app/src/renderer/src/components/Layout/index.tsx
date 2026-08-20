import {
  DarkModeOutlined,
  DashboardOutlined,
  Inventory2Outlined,
  LightModeOutlined,
  ReceiptLongOutlined,
  SellOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import { Box, ButtonBase, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-128x128.png';
import { useThemeMode } from '@/hooks/useThemeMode';
import { CONTROL_RADIUS } from '@/theme';
import { ROUTES } from '../../routes';

interface LayoutProps {
  children: ReactNode;
}

/** Tamanho único de ícone do rail: sem rótulo, o ícone carrega o item sozinho. */
const ICON_SIZE = 22;

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: <DashboardOutlined sx={{ fontSize: ICON_SIZE }} />,
  },
  {
    label: 'Produtos',
    path: ROUTES.PRODUCTS,
    icon: <Inventory2Outlined sx={{ fontSize: ICON_SIZE }} />,
  },
  {
    label: 'Pedidos',
    path: ROUTES.ORDERS,
    icon: <ReceiptLongOutlined sx={{ fontSize: ICON_SIZE }} />,
  },
  { label: 'Vendas', path: ROUTES.SALES, icon: <SellOutlined sx={{ fontSize: ICON_SIZE }} /> },
  {
    label: 'Configurações',
    path: ROUTES.SETTINGS,
    icon: <SettingsOutlined sx={{ fontSize: ICON_SIZE }} />,
  },
];

const RAIL_WIDTH = 64;
/** Alvo de clique dos itens e do toggle: quadrado, para o rail ter um só ritmo. */
const TILE_SIZE = 44;

/**
 * Rail de navegação fixo à esquerda, no lugar de uma barra superior. Num app
 * desktop a altura é o recurso escasso — a barra custava ~64px de conteúdo em
 * toda tela, enquanto o rail cobra largura, que sobra (a janela tem mínimo de
 * 960px). O rail também não rola junto com a página: só o conteúdo rola, para a
 * navegação permanecer sempre alcançável.
 *
 * É só de ícones, sem rótulo visível e sem colapsar/expandir: o nome de cada
 * item vive no `Tooltip` e no `aria-label`. Rótulo de rail é a tentação óbvia e
 * é uma armadilha — para caber, ele desce para 10px, abaixo dos 12px do
 * `caption` em que os limiares de contraste foram medidos.
 *
 * Com o rail, o app deixa de ter layout de janela estreita: não há mais
 * hambúrguer nem `Drawer`, e nenhum `useMediaQuery`. O que ainda precisa se
 * adaptar mede a faixa de conteúdo, por container query.
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
          gap: 1,
          py: 2,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title="Meu Negócio" placement="right">
          <Box
            component="img"
            src={logo}
            alt="Meu Negócio"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            sx={{ width: 32, height: 32, borderRadius: 1, cursor: 'pointer', mb: 2 }}
          />
        </Tooltip>

        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Tooltip key={item.path} title={item.label} placement="right">
              <ButtonBase
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                sx={{
                  position: 'relative',
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  borderRadius: `${CONTROL_RADIUS}px`,
                  color: active ? 'primary.main' : 'text.secondary',
                  bgcolor: (theme) =>
                    active
                      ? alpha(
                          theme.palette.primary.main,
                          theme.palette.mode === 'light' ? 0.12 : 0.22,
                        )
                      : 'transparent',
                  transition: (theme) =>
                    theme.transitions.create(['background-color', 'color'], {
                      duration: theme.transitions.duration.shortest,
                    }),
                  '&:hover': {
                    bgcolor: active ? undefined : 'action.hover',
                    color: active ? undefined : 'text.primary',
                  },
                  // O item ativo precisa dos dois canais: sem o rótulo em
                  // negrito da barra antiga, a cor seria o único sinal, e cor
                  // sozinha não basta. Esta barra encosta na borda esquerda do
                  // rail e sobrevive a daltonismo e a alto contraste.
                  ...(active && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: (RAIL_WIDTH - TILE_SIZE) / -2,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 20,
                      borderRadius: '0 3px 3px 0',
                      bgcolor: 'primary.main',
                    },
                  }),
                }}
              >
                {item.icon}
              </ButtonBase>
            </Tooltip>
          );
        })}

        <Tooltip title="Alternar tema" placement="right">
          <IconButton
            onClick={toggleMode}
            aria-label="Alternar tema"
            sx={{ mt: 'auto', width: TILE_SIZE, height: TILE_SIZE }}
          >
            {mode === 'dark' ? (
              <LightModeOutlined sx={{ fontSize: ICON_SIZE }} />
            ) : (
              <DarkModeOutlined sx={{ fontSize: ICON_SIZE }} />
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
            ~128px. Na largura mínima (960) sobram ~832px — ou seja, `md` (900)
            dispara quando não há espaço de `md`. Este container nomeado deixa os
            componentes consultarem a largura que realmente têm, via
            `@container content (min-width: …)`.

            A faixa é uma coluna flex de altura mínima cheia para que uma página
            possa ocupar a viewport inteira pedindo `flex: 1` — sem isso ela só
            saberia a própria altura via `100vh`, que ignora o padding daqui. Uma
            página que não pede nada continua do tamanho do conteúdo. */}
        <Box
          sx={{
            maxWidth: 1440,
            mx: 'auto',
            p: 3,
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
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
