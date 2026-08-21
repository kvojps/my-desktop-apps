import { Skeleton, Stack, Typography } from '@mui/material';
import { ErrorState } from '@/components/ErrorState';
import type { UseAppInfoReturn } from '@/hooks/settings/useAppInfo';

interface AppInfoPanelProps {
  info: UseAppInfoReturn;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {/* `mono` é o token do tema: caminho de arquivo precisa de largura fixa
          por caractere para ser conferido, e escrever `fontFamily` no `sx` é a
          divergência que o token evita (§6). */}
      <Typography variant="mono" sx={{ userSelect: 'text' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function AppInfoPanel({ info: { info, isLoading, error, retry } }: AppInfoPanelProps) {
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
  return (
    <Stack spacing={1.5}>
      {isLoading || !info ? (
        <>
          <Stack spacing={0.25}>
            <Skeleton variant="text" width={60} />
            <Skeleton variant="text" width={90} />
          </Stack>
          <Stack spacing={0.25}>
            <Skeleton variant="text" width={110} />
            <Skeleton variant="text" width="70%" />
          </Stack>
        </>
      ) : (
        <>
          <InfoRow label="Versão" value={info.version} />
          <InfoRow label="Banco de dados" value={info.dbPath} />
        </>
      )}
    </Stack>
  );
}
