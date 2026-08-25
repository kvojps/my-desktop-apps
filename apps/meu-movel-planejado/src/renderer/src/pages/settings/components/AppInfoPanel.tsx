import { FolderOpen } from '@mui/icons-material';
import { Button, Skeleton, Stack, Typography } from '@mui/material';
import { api } from '@/api/client';
import { ErrorState } from '@/components/ErrorState';
import { useSnackbar } from '@/contexts/SnackbarContext';
import type { UseAppInfoReturn } from '@/hooks/settings/useAppInfo';

interface AppInfoPanelProps {
  /** Os três estados do carregamento, não só o valor — ver `useAppInfo`. */
  state: UseAppInfoReturn;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {/* `mono` é o token do tema: caminho de arquivo precisa de largura fixa
          por caractere para ser conferido, e escrever `fontFamily` no `sx` é a
          divergência que o token evita (§6). Selecionável porque o caminho é
          para ser copiado — para o explorador, para uma conversa de suporte. */}
      <Typography variant="mono" sx={{ userSelect: 'text' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function AppInfoPanel({ state: { info, isLoading, error, retry } }: AppInfoPanelProps) {
  const { showError } = useSnackbar();

  async function handleOpenFolder() {
    try {
      await api.openDataFolder();
    } catch (err) {
      showError(err, 'Não foi possível abrir a pasta de dados');
    }
  }

  // A precedência do design system, na ordem em que ela é escrita: carregando →
  // erro → vazio (§5.3). Olhar o erro primeiro trocaria o esqueleto do `retry`
  // pela falha anterior, que é justamente o que se acabou de mandar refazer.
  if (!isLoading && error) {
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
  return (
    <Stack spacing={2}>
      {isLoading || !info ? (
        <Stack spacing={1.5}>
          <Stack spacing={0.25}>
            <Skeleton variant="text" width={60} />
            <Skeleton variant="text" width={90} />
          </Stack>
          <Stack spacing={0.25}>
            <Skeleton variant="text" width={110} />
            <Skeleton variant="text" width="70%" />
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <InfoRow label="Versão" value={info.version} />
          <InfoRow label="Banco de dados" value={info.dbPath} />
        </Stack>
      )}

      <Stack direction="row">
        <Button variant="outlined" startIcon={<FolderOpen />} onClick={handleOpenFolder}>
          Abrir pasta de dados
        </Button>
      </Stack>
    </Stack>
  );
}
