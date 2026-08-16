import { ErrorOutline, FolderOpen } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { APP_ERROR_DESCRIPTIONS, decodeAppError } from '@shared/errors/appError';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface ErrorStateProps {
  /** O que a tela não conseguiu carregar, ex.: "Não foi possível carregar os diretórios". */
  title: string;
  error: unknown;
  onRetry: () => void;
}

/**
 * Estado de erro das páginas. O texto descreve a falha que realmente pode ter
 * acontecido num app local (banco inacessível, corrompido, sem permissão) e
 * oferece a ação correspondente.
 *
 * Sem "Restaurar backup" aqui: o banco do git-dlog guarda só os diretórios
 * cadastrados e o token, e o app não tem exportação para restaurar.
 */
export function ErrorState({ title, error, onRetry }: ErrorStateProps) {
  const { code, message } = decodeAppError(error);
  const { showError } = useSnackbar();

  const canOpenFolder = code !== 'not-found' && code !== 'invalid-input';

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
