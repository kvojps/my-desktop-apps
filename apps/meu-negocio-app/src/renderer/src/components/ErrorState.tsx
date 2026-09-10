import { ErrorOutline, FolderOpen, Restore } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { APP_ERROR_DESCRIPTIONS, decodeAppError } from '@shared/errors/appError';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface ErrorStateProps {
  /** O que a tela não conseguiu carregar, ex.: "Não foi possível carregar os produtos". */
  title: string;
  error: unknown;
  onRetry: () => void;
  /**
   * Dentro de uma seção, e não ocupando a página: sem o respiro de topo e um
   * degrau menor. É a mesma distinção que o `EmptyState` já faz nas chamadas,
   * com ícone de 48 na página inteira e de 40 numa seção.
   */
  dense?: boolean;
}

/**
 * Estado de erro das páginas. O texto descreve a falha que realmente pode ter
 * acontecido num app local (banco inacessível, corrompido, sem permissão) e
 * oferece a ação correspondente.
 */
export function ErrorState({ title, error, onRetry, dense }: ErrorStateProps) {
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
        showSnackbar('Arquivo de backup inválido', 'error');
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
    <Box sx={{ textAlign: 'center', mt: dense ? 0 : 8, mx: 'auto', maxWidth: 560 }}>
      <ErrorOutline sx={{ fontSize: dense ? 40 : 48, color: 'error.main', mb: 1 }} />
      <Typography variant={dense ? 'h6' : 'h5'} gutterBottom>
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

      {/* Mensagem técnica: `mono` porque é texto de máquina, e `text.secondary`
          porque é conteúdo — `text.disabled` daria 2.68:1 sobre o papel claro. */}
      <Typography variant="mono" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {message}
      </Typography>
    </Box>
  );
}
