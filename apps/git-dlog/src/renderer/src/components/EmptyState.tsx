import { Card, Stack, Typography } from '@mui/material';
import { ReactElement, ReactNode } from 'react';
import { cloneElement } from 'react';

interface EmptyStateProps {
  icon: ReactElement<{ sx?: object }>;
  description: string;
  action?: ReactNode;
  /**
   * `page`: a página inteira está vazia (ícone 48). `section`: é uma seção
   * ou tabela dentro de uma página com outro conteúdo (ícone 40). Ver
   * docs/design-system.md §5.4.
   */
  size?: 'page' | 'section';
}

/**
 * Lista vazia. Três partes sempre: ícone da própria tela, uma frase que diz
 * o que vai aparecer ali, e a ação primária — o mesmo botão do `PageHeader`,
 * repetido onde o olho já está (docs/design-system.md §5.4).
 */
export function EmptyState({ icon, description, action, size = 'page' }: EmptyStateProps) {
  const iconSize = size === 'page' ? 48 : 40;

  return (
    <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
      <Stack spacing={1.5} alignItems="center">
        {cloneElement(icon, {
          sx: { fontSize: iconSize, color: 'text.disabled', ...icon.props.sx },
        })}
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
        {action}
      </Stack>
    </Card>
  );
}
