import {
  CheckCircle2,
  Circle,
  Info,
  KeyRound,
  RefreshCw,
  Settings,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PrIntegrationStatus, PrProviderKind } from '@shared/types/pullRequest';
import { api } from '@/api/client';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/ErrorState';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/PageHeader';
import { useSnackbar } from '@/contexts/SnackbarContext';

const APP_VERSION = '2.0.0';
const TOKEN_DOCS_URL = 'https://github.com/settings/tokens';

const PROVIDER_LABELS: Record<PrProviderKind, string> = {
  'gh-cli': 'GitHub CLI (gh)',
  'github-token': 'Token do GitHub',
  'glab-cli': 'GitLab CLI (glab)',
  none: 'Nenhum',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui:grid ui:grid-cols-[7rem_minmax(0,1fr)] ui:gap-x-4 ui:gap-y-1">
      <dt className="ui:text-sm ui:text-muted-foreground">{label}</dt>
      <dd className="ui:m-0 ui:text-sm ui:text-foreground">{value}</dd>
    </div>
  );
}

function ProviderRow({
  label,
  available,
  detail,
}: {
  label: string;
  available: boolean;
  detail: string;
}) {
  return (
    <li className="ui:flex ui:items-start ui:gap-3">
      {available ? (
        <CheckCircle2
          aria-hidden
          className="ui:mt-0.5 ui:size-4 ui:shrink-0 ui:text-success"
        />
      ) : (
        <Circle
          aria-hidden
          className="ui:mt-0.5 ui:size-4 ui:shrink-0 ui:text-muted-foreground"
        />
      )}
      <div>
        <p className="ui:m-0 ui:text-sm ui:font-semibold ui:text-foreground">{label}</p>
        <p className="ui:mt-0.5 ui:mb-0 ui:text-sm ui:text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

export function SettingsPage() {
  const { showSnackbar, showError } = useSnackbar();
  const [status, setStatus] = useState<PrIntegrationStatus | null>(null);
  const [statusError, setStatusError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [deleteTokenOpen, setDeleteTokenOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const configureTokenButtonRef = useRef<HTMLButtonElement>(null);
  const removeTokenButtonRef = useRef<HTMLButtonElement>(null);
  const focusAfterTokenChange = useRef<'configure' | 'remove' | null>(null);

  const refreshStatus = useCallback(
    async (operation: 'current' | 'redetect') => {
      setIsLoading(true);
      try {
        setStatus(await (operation === 'redetect' ? api.redetectPrProviders() : api.getPrStatus()));
        setStatusError(null);
      } catch (err) {
        setStatusError(err);
        showError(err, 'Erro ao verificar a integração de PRs.');
      } finally {
        setIsLoading(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    void refreshStatus('current');
  }, [refreshStatus]);

  useEffect(() => {
    const target = focusAfterTokenChange.current;
    if (!target || tokenModalOpen || deleteTokenOpen) return;

    const button =
      target === 'configure' ? configureTokenButtonRef.current : removeTokenButtonRef.current;
    if (!button) return;

    focusAfterTokenChange.current = null;
    button.focus();
  }, [deleteTokenOpen, status?.hasGithubToken, tokenModalOpen]);

  async function handleSaveToken() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const login = await api.savePrToken(token);
      setToken('');
      focusAfterTokenChange.current = 'remove';
      setTokenModalOpen(false);
      showSnackbar(`Token salvo e validado como "${login}".`);
      await refreshStatus('current');
    } catch (err) {
      showError(err, 'Erro ao salvar o token.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteToken() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await api.deletePrToken();
      showSnackbar('Token removido.');
      focusAfterTokenChange.current = 'configure';
      setDeleteTokenOpen(false);
      await refreshStatus('current');
    } catch (err) {
      showError(err, 'Erro ao remover o token.');
    } finally {
      setIsDeleting(false);
    }
  }

  function closeTokenModal() {
    if (isSaving) return;
    setToken('');
    setTokenModalOpen(false);
  }

  async function openTokenDocumentation() {
    try {
      await api.openExternal(TOKEN_DOCS_URL);
    } catch (err) {
      showError(err, 'Não foi possível abrir a página para gerar o token.');
    }
  }

  return (
    <div className="ui:space-y-4">
      <PageHeader
        icon={<Settings aria-hidden className="ui:size-[22px] ui:text-muted-foreground" />}
        title="Configurações"
        subtitle="Integração com pull requests e informações do aplicativo."
      />

      <section className="ui:rounded-lg ui:border ui:border-border ui:bg-paper ui:p-5">
        <div className="ui:flex ui:flex-wrap ui:items-start ui:justify-between ui:gap-3">
          <div>
            <h2 className="ui:m-0 ui:text-base ui:font-semibold ui:text-foreground">
              Integrações de pull requests
            </h2>
            <p className="ui:mt-1 ui:mb-0 ui:max-w-[72ch] ui:text-sm ui:text-muted-foreground">
              Para mostrar PRs, o app usa uma ferramenta já autenticada nesta máquina. Se nenhuma
              estiver disponível, use um token do GitHub como alternativa.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void refreshStatus('redetect')}
            disabled={isLoading}
          >
            <RefreshCw aria-hidden />
            {isLoading ? 'Redetectando...' : 'Redetectar'}
          </Button>
        </div>

        {status && !status.anyAvailable && (
          <div className="ui:mt-4 ui:flex ui:gap-3 ui:rounded-md ui:border ui:border-border ui:bg-accent ui:p-3">
            <Info aria-hidden className="ui:mt-0.5 ui:size-4 ui:shrink-0 ui:text-primary" />
            <p className="ui:m-0 ui:text-sm ui:text-foreground">
              Nenhuma integração ativa — os repositórios continuam funcionando normalmente, apenas
              sem PRs. A opção mais simples é instalar o GitHub CLI e rodar{' '}
              <code className="ui:font-mono">gh auth login</code>.
            </p>
          </div>
        )}

        {statusError && !status ? (
          <div className="ui:mt-5 ui:rounded-md ui:border ui:border-border ui:bg-accent ui:p-4">
            <ErrorState
              dense
              title="Não foi possível verificar as integrações de PRs"
              error={statusError}
              onRetry={() => void refreshStatus('current')}
            />
          </div>
        ) : isLoading && !status ? (
          <div aria-hidden className="ui:mt-5 ui:space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="ui:flex ui:gap-3">
                <div className="ui-skeleton ui:mt-0.5 ui:size-4 ui:rounded-full" />
                <div className="ui:flex-1 ui:space-y-2">
                  <div className="ui-skeleton ui:h-4 ui:w-36 ui:rounded" />
                  <div className="ui-skeleton ui:h-4 ui:w-3/4 ui:rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul
            className="ui:mt-5 ui:mb-0 ui:list-none ui:space-y-4 ui:p-0"
            aria-label="Provedores de pull requests"
          >
            {status?.providers.map((provider) => (
              <ProviderRow
                key={provider.kind}
                label={PROVIDER_LABELS[provider.kind]}
                available={provider.available}
                detail={provider.detail}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="ui:rounded-lg ui:border ui:border-border ui:bg-paper ui:p-5">
        <div className="ui:flex ui:flex-wrap ui:items-start ui:justify-between ui:gap-3">
          <div className="ui:flex ui:gap-3">
            <ShieldCheck
              aria-hidden
              className="ui:mt-0.5 ui:size-5 ui:shrink-0 ui:text-muted-foreground"
            />
            <div>
              <h2 className="ui:m-0 ui:text-base ui:font-semibold ui:text-foreground">
                Token do GitHub
              </h2>
              <p className="ui:mt-1 ui:mb-0 ui:max-w-[62ch] ui:text-sm ui:text-muted-foreground">
                {status?.hasGithubToken
                  ? 'Há um token salvo, cifrado pelo cofre de credenciais do sistema.'
                  : status
                    ? 'Sem token salvo. É a alternativa a gh e glab para mostrar PRs.'
                    : 'Configure um token para usá-lo como alternativa às ferramentas de linha de comando.'}
              </p>
            </div>
          </div>
          {status?.hasGithubToken ? (
            <Button
              ref={removeTokenButtonRef}
              variant="outline"
              className="ui:border-danger ui:text-danger"
              onClick={() => setDeleteTokenOpen(true)}
              disabled={isLoading}
            >
              <Trash2 aria-hidden />
              Remover token
            </Button>
          ) : (
            <Button
              ref={configureTokenButtonRef}
              variant="outline"
              onClick={() => setTokenModalOpen(true)}
              disabled={isLoading}
            >
              <KeyRound aria-hidden />
              Configurar token
            </Button>
          )}
        </div>
      </section>

      <Modal
        open={tokenModalOpen}
        title="Configurar token do GitHub"
        onClose={closeTokenModal}
        onSubmit={handleSaveToken}
        actions={
          <>
            <Button variant="outline" onClick={closeTokenModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving || token.trim().length < 8}>
              {isSaving ? 'Validando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <div className="ui:space-y-4 ui:pt-1">
          <div className="ui:space-y-1.5">
            <label
              htmlFor="github-token"
              className="ui:block ui:text-sm ui:font-medium ui:text-foreground"
            >
              Personal access token
            </label>
            <input
              id="github-token"
              autoFocus
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="off"
              aria-describedby="github-token-help"
              className="ui-input ui:h-9 ui:w-full ui:rounded-md ui:border ui:border-border ui:bg-paper ui:px-3 ui:text-foreground"
            />
            <p id="github-token-help" className="ui:m-0 ui:text-sm ui:text-muted-foreground">
              Precisa do escopo repo (ou equivalente somente leitura em tokens fine-grained).
            </p>
            {token.length > 0 && token.trim().length < 8 && (
              <p className="ui:m-0 ui:text-sm ui:text-danger" role="alert">
                Digite um token com pelo menos 8 caracteres para continuar.
              </p>
            )}
          </div>
          <p className="ui:m-0 ui:text-sm ui:text-muted-foreground">
            O token é validado antes de ser salvo e nunca volta para a interface.{' '}
            <button
              type="button"
              className="ui-link"
              onClick={() => void openTokenDocumentation()}
            >
              Gerar um token no GitHub
            </button>
          </p>
        </div>
      </Modal>

      <section className="ui:rounded-lg ui:border ui:border-border ui:bg-paper ui:p-5">
        <h2 className="ui:m-0 ui:text-base ui:font-semibold ui:text-foreground">Sobre</h2>
        <dl className="ui:mt-4 ui:mb-0 ui:space-y-3">
          <InfoRow label="Aplicativo" value="Git Dlog" />
          <InfoRow label="Versão" value={APP_VERSION} />
          <InfoRow
            label="Finalidade"
            value="Mostra, para todos os seus repositórios de uma vez, o que está fora de sincronia, o que só existe localmente e quais PRs estão abertos"
          />
        </dl>
      </section>

      <ConfirmDialog
        open={deleteTokenOpen}
        title="Remover token do GitHub"
        message="Tem certeza que deseja remover o token salvo? A integração por token deixará de estar disponível até que você configure outro."
        confirmLabel="Remover token"
        loadingLabel="Removendo..."
        loading={isDeleting}
        onClose={() => setDeleteTokenOpen(false)}
        onConfirm={() => void handleDeleteToken()}
      />
    </div>
  );
}
