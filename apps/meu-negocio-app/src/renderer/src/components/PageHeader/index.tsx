import { Box, Stack, Typography } from '@mui/material';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    // O espaçamento até o conteúdo é do Stack da página, como entre todas as
    // outras seções — uma margem própria aqui abriria um vão desigual.
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ display: 'flex', color: 'primary.main' }}>{icon}</Box>
        <Box>
          <Typography variant="h5">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {actions && <Box>{actions}</Box>}
    </Stack>
  );
}
