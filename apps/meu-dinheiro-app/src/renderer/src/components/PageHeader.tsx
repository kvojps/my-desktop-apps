import { Box, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    // O espaçamento até o conteúdo é do Stack da página, como entre todas as
    // outras seções — uma margem própria aqui abriria um vão desigual.
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      flexWrap="wrap"
      useFlexGap
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', color: 'primary.main' }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" noWrap title={title}>
            {title}
          </Typography>
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
