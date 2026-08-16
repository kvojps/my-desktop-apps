import { useState } from 'react';
import type { Product } from '@shared/types/product';
import { getErrorMessage } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';

export function useProductConfirm(deleteProduct: (id: string) => Promise<void>) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { showToast } = useToast();

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
      showToast(`Produto "${deleteTarget.name}" excluído.`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      showToast(getErrorMessage(err, 'Erro ao excluir o produto.'), 'error');
    }
  }

  return { deleteTarget, setDeleteTarget, buildProps, handleAction };
}
