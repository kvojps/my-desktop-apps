import { Folder, FolderPlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ScanPath } from '@shared/types/scanPath';
import { api } from '@/api/client';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/ErrorState';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useScanPaths } from '@/hooks/scan-paths/useScanPaths';

export function DirectoriesPage() {
  const { scanPaths, isLoading, error, retry, addScanPath, deleteScanPath } = useScanPaths();
  const { showSnackbar, showError } = useSnackbar();

  const [isAdding, setIsAdding] = useState(false);
  const [deleting, setDeleting] = useState<ScanPath | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const restoreAddButtonFocus = useRef(false);

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
      restoreAddButtonFocus.current = true;
      setDeleting(null);
    } catch (err) {
      showError(err, 'Erro ao remover o diretório.');
    } finally {
      setIsDeleting(false);
    }
  }

  function handleConfirmDialogExited() {
    if (!restoreAddButtonFocus.current) return;
    restoreAddButtonFocus.current = false;
    addButtonRef.current?.focus();
  }

  if (error && !isLoading) {
    return (
      <ErrorState title="Não foi possível carregar os diretórios" error={error} onRetry={retry} />
    );
  }

  return (
    <div className="orca:space-y-4">
      <header className="orca:flex orca:flex-wrap orca:items-start orca:justify-between orca:gap-3">
        <div>
          <h1 className="orca:m-0 orca:text-xl orca:font-bold orca:text-foreground">Diretórios</h1>
          <p className="orca:mt-1 orca:mb-0 orca:text-sm orca:text-muted-foreground">
            Diretórios-base usados na procura recursiva de repositórios git.
          </p>
        </div>
        <Button
          ref={addButtonRef}
          variant="primary"
          onClick={() => void handleAdd()}
          disabled={isAdding}
        >
          <FolderPlus aria-hidden />
          {isAdding ? 'Adicionando...' : 'Adicionar diretório'}
        </Button>
      </header>

      {isLoading ? (
        <div
          aria-hidden
          className="orca:overflow-hidden orca:rounded-lg orca:border orca:border-border orca:bg-paper"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="orca:flex orca:items-center orca:gap-3 orca:border-b orca:border-border orca:px-3 orca:py-3 last:orca:border-b-0"
            >
              <div className="orca-skeleton orca:h-4 orca:w-4 orca:shrink-0 orca:rounded" />
              <div className="orca-skeleton orca:h-4 orca:w-2/3 orca:rounded" />
            </div>
          ))}
        </div>
      ) : scanPaths.length === 0 ? (
        <div className="orca:flex orca:min-h-64 orca:flex-col orca:items-center orca:justify-center orca:gap-3 orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:p-6 orca:text-center">
          <Folder aria-hidden width={48} height={48} className="orca:text-muted-foreground" />
          <p className="orca:m-0 orca:max-w-[48ch] orca:text-sm orca:text-muted-foreground">
            Nenhum diretório-base cadastrado ainda. Adicione um diretório-base para o app procurar
            repositórios git dentro dele.
          </p>
          <Button variant="primary" onClick={() => void handleAdd()} disabled={isAdding}>
            <FolderPlus aria-hidden />
            {isAdding ? 'Adicionando...' : 'Adicionar diretório'}
          </Button>
        </div>
      ) : (
        <ul
          className="orca:m-0 orca:list-none orca:overflow-hidden orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:p-0"
          aria-label="Diretórios-base cadastrados"
        >
          {scanPaths.map((scanPath) => (
            <li
              key={scanPath.id}
              className="orca:flex orca:items-center orca:gap-3 orca:border-b orca:border-border orca:px-3 orca:py-2.5 last:orca:border-b-0"
            >
              <Folder
                aria-hidden
                width={18}
                height={18}
                className="orca:shrink-0 orca:text-muted-foreground"
              />
              <span className="orca:min-w-0 orca:flex-1 orca:break-all orca:font-mono orca:text-sm orca:text-foreground orca:select-text">
                {scanPath.path}
              </span>
              <Button
                variant="icon"
                className="orca:shrink-0 orca:hover:text-danger"
                aria-label={`Remover cadastro de ${scanPath.path}`}
                title="Remover diretório-base"
                onClick={() => setDeleting(scanPath)}
                disabled={isDeleting}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Remover diretório"
        message={`Tem certeza que deseja remover "${deleting?.path ?? ''}" da lista? Isso não apaga nada do disco, apenas para de escanear essa pasta.`}
        confirmLabel="Remover cadastro"
        loadingLabel="Removendo..."
        loading={isDeleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        onExited={handleConfirmDialogExited}
      />
    </div>
  );
}
