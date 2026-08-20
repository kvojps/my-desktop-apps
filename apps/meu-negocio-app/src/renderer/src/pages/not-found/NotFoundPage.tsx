import { TravelExploreOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ROUTES } from '../../routes';

/**
 * Uma rota inexistente é uma página vazia como qualquer outra — ícone, uma
 * frase e a saída —, então usa o mesmo `EmptyState`. O "404" gigante em
 * `text.disabled` que havia aqui era o número menos útil da tela na cor de
 * menor contraste do tema.
 */
export function NotFoundPage() {
  return (
    <EmptyState
      icon={<TravelExploreOutlined sx={{ fontSize: 48 }} />}
      title="Página não encontrada."
      description="O endereço acessado não existe ou foi movido."
      action={
        <Button component={Link} to={ROUTES.DASHBOARD} variant="contained">
          Voltar para o Dashboard
        </Button>
      }
    />
  );
}
