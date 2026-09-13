import { useState } from 'react';

interface RegistryItem {
  id: number;
  name: string;
}

export interface RegistryActions<T extends RegistryItem> {
  formOpen: boolean;
  /** O registro em edição, ou `null` quando o formulário está criando. */
  editing: T | null;
  /** Remonta o formulário a cada abertura, para ele nascer com os valores certos. */
  formKey: number;
  openAdd: () => void;
  openEdit: (item: T) => void;
  closeForm: () => void;

  deleteTarget: T | null;
  deleting: boolean;
  askDelete: (item: T) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

/**
 * Os diálogos de um cadastro de Configurações: criar, editar e excluir.
 *
 * Os quatro cadastros têm exatamente este conjunto — só muda o que cada
 * operação grava —, e é o mesmo desenho do `useItemActions` do detalhe de Mês,
 * sem pagar/receber, que não existem aqui.
 */
export function useRegistryActions<T extends RegistryItem>(
  remove: (id: number) => Promise<void>,
): RegistryActions<T> {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  function open(item: T | null) {
    setEditing(item);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await remove(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  return {
    formOpen,
    editing,
    formKey,
    openAdd: () => open(null),
    openEdit: open,
    closeForm: () => {
      setFormOpen(false);
      setEditing(null);
    },

    deleteTarget,
    deleting,
    askDelete: setDeleteTarget,
    cancelDelete: () => setDeleteTarget(null),
    confirmDelete,
  };
}
