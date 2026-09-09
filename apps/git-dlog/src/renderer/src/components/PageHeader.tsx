import { Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Topo de toda página: ícone + título + subtítulo + ações. Sem margem
 * própria — o espaçamento vertical é do `Stack` da página (docs/design-system.md §3.1).
 */
export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {icon}
        <Stack spacing={0.25}>
          <Typography variant="h5">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Stack>
      </Stack>
      {actions}
    </Stack>
  );
}
