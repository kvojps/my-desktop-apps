import { Add, DeleteOutline, FolderOutlined } from '@mui/icons-material';
import {
  Button,
  Card,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { ScanPath } from '@shared/types/scanPath';
import { api } from '@/api/client';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/ErrorState';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useScanPaths } from '@/hooks/scanPaths/useScanPaths';

export function DirectoriesPage() {
  const { scanPaths, isLoading, error, retry, addScanPath, deleteScanPath } = useScanPaths();
  const { showSnackbar, showError } = useSnackbar();

  const [isAdding, setIsAdding] = useState(false);
  const [deleting, setDeleting] = useState<ScanPath | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleAdd() {
    setIsAdding(true);
    try {
      const path = await api.selectDirectory();
      if (!path) return;
      await addScanPath(path);
      showSnackbar('Diretório adicionado com sucesso.');
    } catch (err) {
      showError(err, 'Erro ao adicionar o diretório.');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteScanPath(deleting.id);
      showSnackbar('Diretório removido com sucesso.');
      setDeleting(null);
    } catch (err) {
      showError(err, 'Erro ao remover o diretório.');
    } finally {
      setIsDeleting(false);
    }
  }

  if (error && !isLoading) {
    return (
      <ErrorState title="Não foi possível carregar os diretórios" error={error} onRetry={retry} />
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack>
          <Typography variant="h5">Diretórios</Typography>
          <Typography variant="body2" color="text.secondary">
            Pastas-base escaneadas recursivamente em busca de repositórios git
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd} disabled={isAdding}>
          {isAdding ? 'Adicionando...' : 'Adicionar diretório'}
        </Button>
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : scanPaths.length === 0 ? (
        <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum diretório cadastrado ainda. Clique em “Adicionar diretório” para começar.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Caminho</TableCell>
                <TableCell align="right" sx={{ width: 80 }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scanPaths.map((scanPath) => (
                <TableRow key={scanPath.id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FolderOutlined fontSize="small" color="action" />
                      <Typography variant="body2">{scanPath.path}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      aria-label="Remover diretório"
                      color="error"
                      onClick={() => setDeleting(scanPath)}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Remover diretório"
        message={`Tem certeza que deseja remover "${deleting?.path ?? ''}" da lista? Isso não apaga nada do disco, apenas para de escanear essa pasta.`}
        loading={isDeleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
