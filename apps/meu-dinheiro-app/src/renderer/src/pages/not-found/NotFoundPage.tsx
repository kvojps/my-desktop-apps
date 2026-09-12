import { SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ROUTES } from '@/routes';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={<SearchX size={48} />}
      title="Página não encontrada"
      description="O endereço acessado não existe."
      action={
        <Button variant="primary" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Voltar para a Visão Geral
        </Button>
      }
    />
  );
}
