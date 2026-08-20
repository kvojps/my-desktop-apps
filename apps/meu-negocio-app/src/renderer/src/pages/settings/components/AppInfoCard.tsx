import { Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import { ErrorState } from '@/components/ErrorState';
import type { UseAppInfoReturn } from '@/hooks/settings/useAppInfo';

interface AppInfoCardProps {
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

export function AppInfoCard({ info: { info, isLoading, error, retry } }: AppInfoCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        {error ? (
          <ErrorState
            dense
            title="Não foi possível ler as informações do aplicativo"
            error={error}
            onRetry={retry}
          />
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Sobre o Aplicativo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Informe estes dados ao pedir ajuda: o arquivo do banco guarda todo o seu histórico e é
              exatamente o que deve ser copiado ao trocar de computador.
            </Typography>

            {/* O esqueleto tem a forma das duas linhas reais, para o card não
                mudar de altura quando os valores chegam (§5.3). */}
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
