import { Copy } from 'lucide-react';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Tooltip } from '@/components/Tooltip';
import { useSnackbar } from '@/contexts/SnackbarContext';
import type { UseAppInfoReturn } from '@/hooks/settings/useAppInfo';

interface AppInfoPanelProps {
  info: UseAppInfoReturn;
}

/**
 * Versão e caminho do banco, em mono e selecionáveis: existem para serem
 * conferidos e copiados. O caminho ainda ganha um botão de copiar, porque é o
 * que se cola numa mensagem de suporte, e selecionar um caminho longo à mão é
 * o tipo de coisa que dá errado.
 */
export function AppInfoPanel({ info: { info, isLoading, error, retry } }: AppInfoPanelProps) {
  const { showSnackbar, showError } = useSnackbar();

  async function copyDbPath(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      showSnackbar('Caminho do banco de dados copiado.');
    } catch (err) {
      showError(err, 'Não foi possível copiar o caminho.');
    }
  }

  if (error) {
    return (
      <ErrorState
        dense
        title="Não foi possível ler as informações do aplicativo"
        error={error}
        onRetry={retry}
      />
    );
  }

  // O esqueleto tem a forma das duas linhas reais, para a seção não mudar de
  // altura quando os valores chegam (§5.3).
  if (isLoading || !info) {
    return (
      <dl className="negocio-info" aria-busy="true">
        <div>
          <dt>
            <span className="negocio-skeleton" style={{ width: 60 }} />
          </dt>
          <dd>
            <span className="negocio-skeleton" style={{ width: 90 }} />
          </dd>
        </div>
        <div>
          <dt>
            <span className="negocio-skeleton" style={{ width: 110 }} />
          </dt>
          <dd>
            <span className="negocio-skeleton" style={{ width: '70%' }} />
          </dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className="negocio-info">
      <div>
        <dt>Versão</dt>
        <dd>
          <code>{info.version}</code>
        </dd>
      </div>
      <div>
        <dt>Banco de dados</dt>
        <dd>
          <code>{info.dbPath}</code>
          <Tooltip title="Copiar caminho">
            <Button
              variant="ghost"
              aria-label="Copiar caminho do banco de dados"
              onClick={() => copyDbPath(info.dbPath)}
            >
              <Copy size={18} aria-hidden="true" />
            </Button>
          </Tooltip>
        </dd>
      </div>
    </dl>
  );
}
