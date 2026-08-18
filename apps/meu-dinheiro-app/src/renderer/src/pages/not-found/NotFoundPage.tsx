import { SearchOffOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ROUTES } from '@/routes';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={<SearchOffOutlined sx={{ fontSize: 48 }} />}
      title="Página não encontrada"
      description="O endereço acessado não existe."
      action={
        <Button variant="contained" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Voltar para a Visão Geral
        </Button>
      }
    />
  );
}
