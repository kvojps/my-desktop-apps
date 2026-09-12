import { CircleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { ROUTES } from '@/routes';

export function NotFoundPage() {
  return (
    <div className="orca:flex orca:min-h-[60vh] orca:flex-col orca:items-center orca:justify-center orca:gap-3 orca:text-center">
      <CircleAlert aria-hidden className="orca:size-12 orca:text-muted-foreground" />
      <p className="orca:m-0 orca:text-3xl orca:font-bold orca:text-foreground">404</p>
      <h1 className="orca:m-0 orca:text-xl orca:font-bold orca:text-foreground">
        Página não encontrada
      </h1>
      <p className="orca:m-0 orca:text-sm orca:text-muted-foreground">
        O endereço acessado não existe ou foi movido.
      </p>
      <Button asChild variant="primary">
        <Link to={ROUTES.REPOS}>Voltar para Repositórios</Link>
      </Button>
    </div>
  );
}
