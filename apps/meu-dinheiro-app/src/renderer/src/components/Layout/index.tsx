import {
  BarChartOutlined,
  DarkModeOutlined,
  DashboardOutlined,
  LightModeOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import { Box, ButtonBase, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ROUTES } from '@/routes';
import { CONTROL_RADIUS } from '@/theme';

interface LayoutProps {
  children: ReactNode;
}

/** Tamanho único de ícone do rail: sem rótulo, o ícone carrega o item sozinho. */
const ICON_SIZE = 22;

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  /** Rotas que pertencem ao item mas não são o destino dele. */
  matchPrefixes?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Visão Geral',
    path: ROUTES.DASHBOARD,
    icon: <DashboardOutlined sx={{ fontSize: ICON_SIZE }} />,
  },
  {
    label: 'Histórico',
    path: ROUTES.HISTORY,
    icon: <BarChartOutlined sx={{ fontSize: ICON_SIZE }} />,
    // O detalhe de mês é alcançado pelas tabelas do dashboard e do histórico, mas
    // é ao histórico que ele pertence — é a tela que lista meses. Sem isto o rail
    // fica inteiro apagado em /months/5, e um rail sem rótulo apagado não diz
    // nada sobre onde o usuário está.
    matchPrefixes: ['/months'],
  },
  {
    label: 'Configurações',
    path: ROUTES.SETTINGS,
    icon: <SettingsOutlined sx={{ fontSize: ICON_SIZE }} />,
  },
];

const RAIL_WIDTH = 64;
/** Alvo de clique dos itens e do toggle: quadrado, para o rail ter um só ritmo. */
const TILE_SIZE = 44;

function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.path) return true;
  return (item.matchPrefixes ?? []).some((prefix) => pathname.startsWith(prefix));
}

/**
 * Rail de navegação fixo à esquerda, no lugar de uma barra superior. Num app
 * desktop a altura é o recurso escasso — a barra custava ~64px de conteúdo em
 * toda tela, enquanto o rail cobra largura, que sobra (a janela tem mínimo de
 * 960px). O rail também não rola junto com a página: só o conteúdo rola.
 *
 * O rail é só de ícones. A versão anterior empilhava um rótulo de 10px sob cada
 * ícone: pequeno demais para ser lido com conforto, grande demais para ser
 * ignorado, e abaixo dos 12px do `caption` em que o design system mediu os
 * limiares de contraste. O nome de cada item passou para o tooltip e para o
 * `aria-label`, e a largura caiu de 92 para 64px.
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
          const active = isActive(location.pathname, item);
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
                  // O rótulo em negrito era o canal não-cromático do item ativo;
                  // sem ele, cor seria o único sinal, e cor sozinha não basta.
                  // Esta barra encosta na borda esquerda do rail e sobrevive a
                  // daltonismo e a alto contraste.
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
