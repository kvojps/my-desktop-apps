import { CircleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { ROUTES } from '@/routes';

export function NotFoundPage() {
  return (
    <div className="ui:flex ui:min-h-[60vh] ui:flex-col ui:items-center ui:justify-center ui:gap-3 ui:text-center">
      <CircleAlert aria-hidden className="ui:size-12 ui:text-muted-foreground" />
      <p className="ui:m-0 ui:text-3xl ui:font-bold ui:text-foreground">404</p>
      <h1 className="ui:m-0 ui:text-xl ui:font-bold ui:text-foreground">
        Página não encontrada
      </h1>
      <p className="ui:m-0 ui:text-sm ui:text-muted-foreground">
        O endereço acessado não existe ou foi movido.
      </p>
      <Button asChild variant="primary">
        <Link to={ROUTES.REPOS}>Voltar para Repositórios</Link>
      </Button>
    </div>
  );
}
