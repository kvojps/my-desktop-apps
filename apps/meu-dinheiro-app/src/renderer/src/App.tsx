import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './routes';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { HistoryPage } from './pages/history/HistoryPage';
import { MonthDetailPage } from './pages/month-detail/MonthDetailPage';
import { NotFoundPage } from './pages/not-found/NotFoundPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { Layout } from './components/Layout';
import { BankAccountsProvider } from './contexts/BankAccountsContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { MonthsProvider } from './contexts/MonthsContext';
import { SnackbarProvider } from './contexts/SnackbarContext';

export function App() {
  return (
    <SnackbarProvider>
      <MonthsProvider>
        <CategoriesProvider>
          <BankAccountsProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate replace to={ROUTES.DASHBOARD} />} />
                <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
                <Route path={ROUTES.MONTH_DETAIL} element={<MonthDetailPage />} />
                <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </BankAccountsProvider>
        </CategoriesProvider>
      </MonthsProvider>
    </SnackbarProvider>
  );
}
