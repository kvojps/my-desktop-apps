import {
  CheckCircle,
  DeleteOutline,
  RadioButtonUnchecked,
  Refresh,
  SettingsOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import type { PrIntegrationStatus, PrProviderKind } from '@shared/types/pullRequest';
import { api } from '@/api/client';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/PageHeader';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { openExternal } from '@/utils/pullRequest';

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
    <Stack direction="row" spacing={2}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
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
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      {available ? (
        <CheckCircle color="success" fontSize="small" sx={{ mt: 0.25 }} />
      ) : (
        <RadioButtonUnchecked color="disabled" fontSize="small" sx={{ mt: 0.25 }} />
      )}
      <Stack>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      </Stack>
    </Stack>
  );
}

export function SettingsPage() {
  const { showSnackbar, showError } = useSnackbar();
  const [status, setStatus] = useState<PrIntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  const loadStatus = useCallback(
    async (redetect = false) => {
      setIsLoading(true);
      try {
        setStatus(await (redetect ? api.redetectPrProviders() : api.getPrStatus()));
      } catch (err) {
        showError(err, 'Erro ao verificar a integração de PRs.');
      } finally {
        setIsLoading(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function handleSaveToken() {
    setIsSaving(true);
    try {
      const login = await api.savePrToken(token);
      setToken('');
      setTokenModalOpen(false);
      showSnackbar(`Token salvo e validado como "${login}".`);
      await loadStatus();
    } catch (err) {
      showError(err, 'Erro ao salvar o token.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteToken() {
    try {
      await api.deletePrToken();
      showSnackbar('Token removido.');
      await loadStatus();
    } catch (err) {
      showError(err, 'Erro ao remover o token.');
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        icon={<SettingsOutlined sx={{ fontSize: 22 }} color="action" />}
        title="Configurações"
        subtitle="Integração com pull requests e informações do aplicativo"
      />

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">Pull requests</Typography>
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={() => loadStatus(true)}
              disabled={isLoading}
            >
              {isLoading ? 'Redetectando...' : 'Redetectar'}
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Para mostrar PRs, o app usa uma ferramenta que já esteja autenticada na sua máquina. Se
            nenhuma estiver disponível, use um token do GitHub como alternativa.
          </Typography>

          {status && !status.anyAvailable && (
            <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
              Nenhuma integração ativa — os repositórios continuam funcionando normalmente, apenas
              sem a coluna de PRs. A opção mais simples é instalar o GitHub CLI e rodar{' '}
              <code>gh auth login</code>.
            </Alert>
          )}

          <Stack spacing={1.5}>
            {status?.providers.map((provider) => (
              <ProviderRow
                key={provider.kind}
                label={PROVIDER_LABELS[provider.kind]}
                available={provider.available}
                detail={provider.detail}
              />
            ))}
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Token do GitHub
          </Typography>

          {status?.hasGithubToken ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                Há um token salvo, cifrado pelo cofre de credenciais do sistema.
              </Typography>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutline />}
                onClick={handleDeleteToken}
              >
                Remover
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                Sem token salvo. É a alternativa a `gh`/`glab` para mostrar PRs.
              </Typography>
              <Button variant="outlined" size="small" onClick={() => setTokenModalOpen(true)}>
                Configurar token
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Modal
        open={tokenModalOpen}
        title="Configurar token do GitHub"
        onClose={() => !isSaving && setTokenModalOpen(false)}
        onSubmit={handleSaveToken}
        actions={
          <>
            <Button type="button" onClick={() => setTokenModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || token.trim().length < 8}
            >
              {isSaving ? 'Validando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <TextField
            autoFocus
            fullWidth
            type="password"
            placeholder="ghp_..."
            label="Personal access token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="off"
            helperText="Precisa do escopo repo (ou read-only equivalente em tokens fine-grained)."
          />
          <Typography variant="caption" color="text.secondary">
            O token é validado antes de ser salvo e nunca volta para a interface.{' '}
            <Link component="button" variant="caption" onClick={() => openExternal(TOKEN_DOCS_URL)}>
              Gerar um token no GitHub
            </Link>
          </Typography>
        </Stack>
      </Modal>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Sobre
          </Typography>
          <Stack spacing={1}>
            <InfoRow label="Aplicativo" value="Git Dlog" />
            <InfoRow label="Versão" value={APP_VERSION} />
            <InfoRow
              label="Finalidade"
              value="Mostra, para todos os seus repositórios de uma vez, o que está fora de sincronia, o que só existe localmente e quais PRs estão abertos"
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
