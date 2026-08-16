import { ErrorOutline, FolderOpen, Restore } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { APP_ERROR_DESCRIPTIONS, decodeAppError } from '@shared/errors/appError';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface ErrorStateProps {
  /** O que a tela não conseguiu carregar, ex.: "Não foi possível carregar os meses". */
  title: string;
  error: unknown;
  onRetry: () => void;
}

/**
 * Estado de erro das páginas. O texto descreve a falha que realmente pode ter
 * acontecido num app local (banco inacessível, corrompido, sem permissão) e
 * oferece a ação correspondente.
 */
export function ErrorState({ title, error, onRetry }: ErrorStateProps) {
  const { code, message } = decodeAppError(error);
  const { showSnackbar, showError } = useSnackbar();
  const [restoring, setRestoring] = useState(false);

  const canRestore = code === 'db-corrupted' || code === 'db-unavailable' || code === 'unknown';
  const canOpenFolder = code !== 'not-found' && code !== 'invalid-input';

  async function handleRestore() {
    setRestoring(true);
    try {
      const result = await api.importData();
      if (result.success) {
        showSnackbar('Backup restaurado');
        onRetry();
      } else if (result.error !== 'canceled') {
        showSnackbar(result.message ?? 'Arquivo de backup inválido', 'error');
      }
    } catch (err) {
      showError(err);
    } finally {
      setRestoring(false);
    }
  }

  async function handleOpenFolder() {
    try {
      await api.openDataFolder();
    } catch (err) {
      showError(err);
    }
  }

  return (
    <Box sx={{ textAlign: 'center', mt: 8, mx: 'auto', maxWidth: 560 }}>
      <ErrorOutline sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {APP_ERROR_DESCRIPTIONS[code]}
      </Typography>

      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
        <Button variant="contained" onClick={onRetry}>
          Tentar novamente
        </Button>
        {canRestore && (
          <Button
            variant="outlined"
            startIcon={<Restore />}
            onClick={handleRestore}
            disabled={restoring}
          >
            Restaurar backup
          </Button>
        )}
        {canOpenFolder && (
          <Button variant="outlined" startIcon={<FolderOpen />} onClick={handleOpenFolder}>
            Abrir pasta de dados
          </Button>
        )}
      </Stack>

      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: 'block', mt: 3, fontFamily: 'monospace', wordBreak: 'break-word' }}
      >
        {message}
      </Typography>
    </Box>
  );
}
