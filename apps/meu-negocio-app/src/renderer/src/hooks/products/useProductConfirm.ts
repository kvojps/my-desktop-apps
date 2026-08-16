import { useState } from 'react';
import type { Product } from '@shared/types/product';
import { useSnackbar } from '@/contexts/SnackbarContext';

export function useProductConfirm(deleteProduct: (id: string) => Promise<void>) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { showSnackbar, showError } = useSnackbar();

  function buildProps() {
    return {
      title: 'Excluir Produto',
      message: `Tem certeza que deseja excluir ${deleteTarget?.name}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Confirmar Exclusão',
      danger: true as const,
    };
  }

  async function handleAction() {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      showSnackbar(`Produto "${deleteTarget.name}" excluído.`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      showError(err, 'Erro ao excluir o produto.');
    }
  }

  return { deleteTarget, setDeleteTarget, buildProps, handleAction };
}
