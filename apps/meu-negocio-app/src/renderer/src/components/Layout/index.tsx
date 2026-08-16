import { Brightness4, Brightness7, Menu as MenuIcon } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-128x128.png';
import { DashboardIcon, OrderIcon, ProductIcon, SaleIcon, SettingIcon } from '@/components/Icons';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ROUTES } from '../../routes';

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: <DashboardIcon size={18} />,
  },
  { label: 'Produtos', path: ROUTES.PRODUCTS, icon: <ProductIcon size={18} /> },
  { label: 'Pedidos', path: ROUTES.ORDERS, icon: <OrderIcon size={18} /> },
  { label: 'Vendas', path: ROUTES.SALES, icon: <SaleIcon size={18} /> },
  {
    label: 'Configurações',
    path: ROUTES.SETTINGS,
    icon: <SettingIcon size={18} />,
  },
];

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  function go(path: string) {
    navigate(path);
    setDrawerOpen(false);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="default" sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              mr: isMobile ? 'auto' : 4,
            }}
            onClick={() => go(ROUTES.DASHBOARD)}
          >
            <Box
              component="img"
              src={logo}
              alt=""
              width={24}
              height={24}
              sx={{ borderRadius: '3px' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Meu Negócio
            </Typography>
          </Box>

          {isMobile ? (
            <IconButton onClick={() => setDrawerOpen(true)} aria-label="Abrir menu">
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
              {NAV_ITEMS.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    onClick={() => go(item.path)}
                    startIcon={item.icon}
                    color={active ? 'primary' : 'inherit'}
                    sx={{
                      fontWeight: active ? 700 : 500,
                      bgcolor: active ? 'action.selected' : 'transparent',
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          <IconButton onClick={toggleMode} aria-label="Alternar tema" color="inherit">
            {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 240 }} role="presentation">
          <List>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.path}
                selected={location.pathname === item.path}
                onClick={() => go(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Em monitores largos o grid de cards viraria uma fileira de oito e as
          tabelas esticariam até a leitura de cada linha exigir varrer a tela.
          O conteúdo para de crescer e passa a centralizar. */}
      <Box component="main" sx={{ flex: 1, width: '100%', maxWidth: 1440, mx: 'auto', p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
