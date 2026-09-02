import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './routes';
import { ReposProvider } from './contexts/ReposContext';
import { ScanPathsProvider } from './contexts/ScanPathsContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { Layout } from './components/Layout';
import { DirectoriesPage } from './pages/directories/DirectoriesPage';
import { NotFoundPage } from './pages/not-found/NotFoundPage';
import { ReposPage } from './pages/repos/ReposPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export function App() {
  return (
    <SnackbarProvider>
      <ScanPathsProvider>
        <ReposProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate replace to={ROUTES.REPOS} />} />
              <Route path={ROUTES.DIRECTORIES} element={<DirectoriesPage />} />
              <Route path={ROUTES.REPOS} element={<ReposPage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </ReposProvider>
      </ScanPathsProvider>
    </SnackbarProvider>
  );
}
