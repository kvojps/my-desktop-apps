import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './routes';
import { OrdersProvider } from './contexts/OrdersContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { NotFoundPage } from './pages/not-found/NotFoundPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { SalesPage } from './pages/sales/SalesPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export function App() {
  return (
    <SnackbarProvider>
      <ProductsProvider>
        <OrdersProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate replace to={ROUTES.DASHBOARD} />} />
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
              <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
              <Route path={ROUTES.SALES} element={<SalesPage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </OrdersProvider>
      </ProductsProvider>
    </SnackbarProvider>
  );
}
