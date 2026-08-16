import { Card, CardContent, Stack, Typography } from '@mui/material';
import type { AppInfo } from '@shared/types/appInfo';

interface AppInfoCardProps {
  info: AppInfo | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontFamily: 'monospace', wordBreak: 'break-all', userSelect: 'text' }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export function AppInfoCard({ info }: AppInfoCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Sobre o Aplicativo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Informe estes dados ao pedir ajuda: o arquivo do banco guarda todo o seu histórico e é
          exatamente o que deve ser copiado ao trocar de computador.
        </Typography>

        {info === null ? (
          <Typography variant="body2" color="text.secondary">
            Carregando informações…
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            <InfoRow label="Versão" value={info.version} />
            <InfoRow label="Banco de dados" value={info.dbPath} />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
