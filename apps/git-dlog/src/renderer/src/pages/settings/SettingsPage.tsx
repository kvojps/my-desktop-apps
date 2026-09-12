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
    <div className="orca:grid orca:grid-cols-[7rem_minmax(0,1fr)] orca:gap-x-4 orca:gap-y-1">
      <dt className="orca:text-sm orca:text-muted-foreground">{label}</dt>
      <dd className="orca:m-0 orca:text-sm orca:text-foreground">{value}</dd>
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
    <li className="orca:flex orca:items-start orca:gap-3">
      {available ? (
        <CheckCircle2
          aria-hidden
          className="orca:mt-0.5 orca:size-4 orca:shrink-0 orca:text-success"
        />
      ) : (
        <Circle
          aria-hidden
          className="orca:mt-0.5 orca:size-4 orca:shrink-0 orca:text-muted-foreground"
        />
      )}
      <div>
        <p className="orca:m-0 orca:text-sm orca:font-semibold orca:text-foreground">{label}</p>
        <p className="orca:mt-0.5 orca:mb-0 orca:text-sm orca:text-muted-foreground">{detail}</p>
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
    <div className="orca:space-y-4">
      <PageHeader
        icon={<Settings aria-hidden className="orca:size-[22px] orca:text-muted-foreground" />}
        title="Configurações"
        subtitle="Integração com pull requests e informações do aplicativo."
      />

      <section className="orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:p-5">
        <div className="orca:flex orca:flex-wrap orca:items-start orca:justify-between orca:gap-3">
          <div>
            <h2 className="orca:m-0 orca:text-base orca:font-semibold orca:text-foreground">
              Integrações de pull requests
            </h2>
            <p className="orca:mt-1 orca:mb-0 orca:max-w-[72ch] orca:text-sm orca:text-muted-foreground">
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
          <div className="orca:mt-4 orca:flex orca:gap-3 orca:rounded-md orca:border orca:border-border orca:bg-accent orca:p-3">
            <Info aria-hidden className="orca:mt-0.5 orca:size-4 orca:shrink-0 orca:text-primary" />
            <p className="orca:m-0 orca:text-sm orca:text-foreground">
              Nenhuma integração ativa — os repositórios continuam funcionando normalmente, apenas
              sem PRs. A opção mais simples é instalar o GitHub CLI e rodar{' '}
              <code className="orca:font-mono">gh auth login</code>.
            </p>
          </div>
        )}

        {statusError && !status ? (
          <div className="orca:mt-5 orca:rounded-md orca:border orca:border-border orca:bg-accent orca:p-4">
            <ErrorState
              dense
              title="Não foi possível verificar as integrações de PRs"
              error={statusError}
              onRetry={() => void refreshStatus('current')}
            />
          </div>
        ) : isLoading && !status ? (
          <div aria-hidden className="orca:mt-5 orca:space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="orca:flex orca:gap-3">
                <div className="orca-skeleton orca:mt-0.5 orca:size-4 orca:rounded-full" />
                <div className="orca:flex-1 orca:space-y-2">
                  <div className="orca-skeleton orca:h-4 orca:w-36 orca:rounded" />
                  <div className="orca-skeleton orca:h-4 orca:w-3/4 orca:rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul
            className="orca:mt-5 orca:mb-0 orca:list-none orca:space-y-4 orca:p-0"
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

      <section className="orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:p-5">
        <div className="orca:flex orca:flex-wrap orca:items-start orca:justify-between orca:gap-3">
          <div className="orca:flex orca:gap-3">
            <ShieldCheck
              aria-hidden
              className="orca:mt-0.5 orca:size-5 orca:shrink-0 orca:text-muted-foreground"
            />
            <div>
              <h2 className="orca:m-0 orca:text-base orca:font-semibold orca:text-foreground">
                Token do GitHub
              </h2>
              <p className="orca:mt-1 orca:mb-0 orca:max-w-[62ch] orca:text-sm orca:text-muted-foreground">
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
              className="orca:border-danger orca:text-danger"
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
        <div className="orca:space-y-4 orca:pt-1">
          <div className="orca:space-y-1.5">
            <label
              htmlFor="github-token"
              className="orca:block orca:text-sm orca:font-medium orca:text-foreground"
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
              className="orca-input orca:h-9 orca:w-full orca:rounded-md orca:border orca:border-border orca:bg-paper orca:px-3 orca:text-foreground"
            />
            <p id="github-token-help" className="orca:m-0 orca:text-sm orca:text-muted-foreground">
              Precisa do escopo repo (ou equivalente somente leitura em tokens fine-grained).
            </p>
            {token.length > 0 && token.trim().length < 8 && (
              <p className="orca:m-0 orca:text-sm orca:text-danger" role="alert">
                Digite um token com pelo menos 8 caracteres para continuar.
              </p>
            )}
          </div>
          <p className="orca:m-0 orca:text-sm orca:text-muted-foreground">
            O token é validado antes de ser salvo e nunca volta para a interface.{' '}
            <button
              type="button"
              className="orca-link"
              onClick={() => void openTokenDocumentation()}
            >
              Gerar um token no GitHub
            </button>
          </p>
        </div>
      </Modal>

      <section className="orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:p-5">
        <h2 className="orca:m-0 orca:text-base orca:font-semibold orca:text-foreground">Sobre</h2>
        <dl className="orca:mt-4 orca:mb-0 orca:space-y-3">
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
