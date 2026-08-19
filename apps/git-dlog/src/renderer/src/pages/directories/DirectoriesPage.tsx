import { Add, DeleteOutline, FolderOutlined } from '@mui/icons-material';
import { Button, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { ScanPath } from '@shared/types/scanPath';
import { api } from '@/api/client';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
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

  const columns: DataTableColumn<ScanPath>[] = [
    {
      key: 'path',
      header: 'Caminho',
      render: (scanPath) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <FolderOutlined fontSize="small" color="action" />
          <Typography variant="body2">{scanPath.path}</Typography>
        </Stack>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (scanPath) => (
        <IconButton
          size="small"
          aria-label="Remover diretório"
          color="error"
          onClick={() => setDeleting(scanPath)}
        >
          <DeleteOutline fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Stack spacing={2}>
      <PageHeader
        icon={<FolderOutlined sx={{ fontSize: 22 }} color="action" />}
        title="Diretórios"
        subtitle="Pastas-base escaneadas recursivamente em busca de repositórios git"
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={handleAdd} disabled={isAdding}>
            {isAdding ? 'Adicionando...' : 'Adicionar diretório'}
          </Button>
        }
      />

      {isLoading ? (
        <Stack spacing={1}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={40} />
          ))}
        </Stack>
      ) : (
        <DataTable
          columns={columns}
          items={scanPaths}
          getRowKey={(scanPath) => scanPath.id}
          empty={
            <EmptyState
              icon={<FolderOutlined />}
              description="Nenhum diretório cadastrado ainda. Cadastre uma pasta-base para o app procurar repositórios git dentro dela."
              action={
                <Button variant="outlined" size="small" onClick={handleAdd} disabled={isAdding}>
                  Adicionar diretório
                </Button>
              }
            />
          }
        />
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
