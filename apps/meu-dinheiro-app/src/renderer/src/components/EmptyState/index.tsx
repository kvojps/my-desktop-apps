import { Box, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface EmptyStateProps {
  /** Ícone da própria tela — reforça que a lista está vazia de propósito. */
  icon: ReactNode;
  /** Uma frase dizendo o que vai aparecer ali. */
  title: string;
  description?: string;
  /** A saída: criar o primeiro registro, ou limpar o filtro que não achou nada. */
  action?: ReactNode;
}

/**
 * Lista vazia é o primeiro contato de todo usuário com toda tela, e uma frase
 * cinza no meio de uma tabela não é um estado vazio.
 *
 * São três casos, e confundir os dois primeiros é o erro comum — mandar
 * "cadastre sua primeira despesa" para quem tem 400 e digitou um filtro errado:
 *
 * - nunca teve registro → ícone da tela, o que ela faz, ação de criar;
 * - filtro não achou nada → ícone de filtro, diz que é o filtro, ação de limpar;
 * - falhou ao carregar → não é vazio, é erro: use `ErrorState`.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 6, px: 2, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', color: 'text.disabled' }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" color="text.disabled" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  );
}
