import { CircleAlert, FolderOpen } from 'lucide-react';
import { APP_ERROR_DESCRIPTIONS, decodeAppError } from '@shared/errors/appError';
import { api } from '@/api/client';
import { Button } from '@/components/Button';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface ErrorStateProps {
  /** O que a tela não conseguiu carregar, ex.: "Não foi possível carregar os diretórios". */
  title: string;
  error: unknown;
  onRetry: () => void;
  /** Falha de uma seção dentro de uma tela, com ícone e título menores. */
  dense?: boolean;
}

/**
 * Estado de erro das páginas. O texto descreve a falha que realmente pode ter
 * acontecido num app local (banco inacessível, corrompido, sem permissão) e
 * oferece a ação correspondente. Ele substitui a tela inteira, então é o título
 * dele que responde pelo `h1` e o ícone é o de 48 (design system §5.4).
 *
 * Sem "Restaurar backup" aqui: o banco do git-dlog guarda só os diretórios
 * cadastrados e o token, e o app não tem exportação para restaurar.
 *
 * A mensagem crua do erro é conteúdo, e vai em texto secundário: apagá-la mais
 * do que isso reprovaria em contraste (design system §1.4).
 */
export function ErrorState({ title, error, onRetry, dense = false }: ErrorStateProps) {
  const { code, message } = decodeAppError(error);
  const { showError } = useSnackbar();

  const canOpenFolder = code !== 'not-found' && code !== 'invalid-input';

  async function handleOpenFolder() {
    try {
      await api.openDataFolder();
    } catch (err) {
      showError(err);
    }
  }

  const Title = dense ? 'h3' : 'h1';
  const containerClass = dense
    ? 'ui:mx-0 ui:mt-0 ui:max-w-none ui:space-y-3'
    : 'ui:mx-auto ui:mt-16 ui:max-w-[560px] ui:space-y-3 ui:text-center';
  const iconClass = dense ? 'ui:text-danger' : 'ui:mx-auto ui:text-danger';
  const actionsClass = dense
    ? 'ui:flex ui:flex-wrap ui:gap-2'
    : 'ui:flex ui:flex-wrap ui:justify-center ui:gap-2';

  return (
    <div className={containerClass}>
      <CircleAlert
        aria-hidden
        width={dense ? 40 : 48}
        height={dense ? 40 : 48}
        className={iconClass}
      />
      <Title className="ui:m-0 ui:text-xl ui:font-bold ui:text-foreground">{title}</Title>
      <p className="ui:m-0 ui:text-sm ui:text-muted-foreground">
        {APP_ERROR_DESCRIPTIONS[code]}
      </p>

      <div className={actionsClass}>
        <Button variant="primary" onClick={onRetry}>
          Tentar novamente
        </Button>
        {canOpenFolder && (
          <Button variant="outline" onClick={() => void handleOpenFolder()}>
            <FolderOpen aria-hidden />
            Abrir pasta de dados
          </Button>
        )}
      </div>

      <p className="ui:m-0 ui:pt-2 ui:font-mono ui:text-xs ui:break-words ui:text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
