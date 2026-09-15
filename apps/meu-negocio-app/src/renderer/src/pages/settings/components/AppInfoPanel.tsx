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
 * Nome, versão e caminho do banco, em mono e selecionáveis: existem para serem
 * conferidos e copiados. O caminho ainda ganha um botão de copiar, porque é o
 * que se cola numa mensagem de suporte, e selecionar um caminho longo à mão é
 * o tipo de coisa que dá errado.
 *
 * Nome e versão vêm do build (`__APP_VERSION__`, a mesma da lateral) e por isso
 * aparecem sempre; só o caminho do banco depende do IPC, e é só ele que carrega
 * ou falha.
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

  const pending = !error && (isLoading || !info);

  return (
    <>
      <dl className="negocio-info" aria-busy={pending || undefined}>
        <div>
          <dt>Aplicativo</dt>
          <dd>Meu Negócio</dd>
        </div>
        <div>
          <dt>Versão</dt>
          <dd>
            <code>{__APP_VERSION__}</code>
          </dd>
        </div>
        {/* O esqueleto tem a forma da linha real, para a seção não mudar de
            altura quando o caminho chega (§5.3). */}
        {pending && (
          <div>
            <dt>
              <span className="negocio-skeleton" style={{ width: 110 }} />
            </dt>
            <dd>
              <span className="negocio-skeleton" style={{ width: '70%' }} />
            </dd>
          </div>
        )}
        {!error && info && (
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
        )}
      </dl>
      {error ? (
        <ErrorState
          dense
          title="Não foi possível ler o caminho do banco de dados"
          error={error}
          onRetry={retry}
        />
      ) : null}
    </>
  );
}
