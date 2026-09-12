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
    <div className="ui:space-y-4">
      <header className="ui:flex ui:flex-wrap ui:items-start ui:justify-between ui:gap-3">
        <div>
          <h1 className="ui:m-0 ui:text-xl ui:font-bold ui:text-foreground">Diretórios</h1>
          <p className="ui:mt-1 ui:mb-0 ui:text-sm ui:text-muted-foreground">
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
          className="ui:overflow-hidden ui:rounded-lg ui:border ui:border-border ui:bg-paper"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="ui:flex ui:items-center ui:gap-3 ui:border-b ui:border-border ui:px-3 ui:py-3 last:ui:border-b-0"
            >
              <div className="ui-skeleton ui:h-4 ui:w-4 ui:shrink-0 ui:rounded" />
              <div className="ui-skeleton ui:h-4 ui:w-2/3 ui:rounded" />
            </div>
          ))}
        </div>
      ) : scanPaths.length === 0 ? (
        <div className="ui:flex ui:min-h-64 ui:flex-col ui:items-center ui:justify-center ui:gap-3 ui:rounded-lg ui:border ui:border-border ui:bg-paper ui:p-6 ui:text-center">
          <Folder aria-hidden width={48} height={48} className="ui:text-muted-foreground" />
          <p className="ui:m-0 ui:max-w-[48ch] ui:text-sm ui:text-muted-foreground">
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
          className="ui:m-0 ui:list-none ui:overflow-hidden ui:rounded-lg ui:border ui:border-border ui:bg-paper ui:p-0"
          aria-label="Diretórios-base cadastrados"
        >
          {scanPaths.map((scanPath) => (
            <li
              key={scanPath.id}
              className="ui:flex ui:items-center ui:gap-3 ui:border-b ui:border-border ui:px-3 ui:py-2.5 last:ui:border-b-0"
            >
              <Folder
                aria-hidden
                width={18}
                height={18}
                className="ui:shrink-0 ui:text-muted-foreground"
              />
              <span className="ui:min-w-0 ui:flex-1 ui:break-all ui:font-mono ui:text-sm ui:text-foreground ui:select-text">
                {scanPath.path}
              </span>
              <Button
                variant="icon"
                className="ui:shrink-0 ui:hover:text-danger"
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
