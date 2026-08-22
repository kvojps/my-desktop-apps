import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './routes';
import { NotFoundPage } from './pages/not-found/NotFoundPage';
import { ProjectPage } from './pages/project/ProjectPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { Layout } from './components/Layout';
import { SnackbarProvider } from './contexts/SnackbarContext';

export function App() {
  return (
    <SnackbarProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate replace to={ROUTES.PROJECTS} />} />
          <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
          <Route path={ROUTES.PROJECT} element={<ProjectPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </SnackbarProvider>
  );
}
