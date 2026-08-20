import { useState } from 'react';
import type { Product } from '@shared/types/product';
import { useSnackbar } from '@/contexts/SnackbarContext';

export function useProductConfirm(deleteProduct: (id: string) => Promise<void>) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  // Enquanto o IPC não volta o botão precisa dizer que está trabalhando, senão
  // ele segue clicável e o usuário dispara a exclusão duas vezes (§5.3).
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSnackbar, showError } = useSnackbar();

  function buildProps() {
    return {
      title: 'Excluir Produto',
      message: `Tem certeza que deseja excluir ${deleteTarget?.name}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Confirmar Exclusão',
      loadingLabel: 'Excluindo...',
      danger: true as const,
    };
  }

  async function handleAction() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      showSnackbar(`Produto "${deleteTarget.name}" excluído.`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      showError(err, 'Erro ao excluir o produto.');
    } finally {
      setIsDeleting(false);
    }
  }

  return { deleteTarget, setDeleteTarget, isDeleting, buildProps, handleAction };
}
