import { useState } from 'react';

interface ItemLike {
  id: number;
  name: string;
}

export interface ItemActions<T extends ItemLike> {
  addOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;

  /** Item no diálogo de pagar (despesa) ou receber (entrada). */
  settling: T | null;
  settleOpen: boolean;
  openSettle: (item: T) => void;
  closeSettle: () => void;

  editing: T | null;
  editOpen: boolean;
  /** Remonta o formulário a cada abertura, para ele nascer com os valores do item. */
  editKey: number;
  openEdit: (item: T) => void;
  closeEdit: () => void;

  detail: T | null;
  detailOpen: boolean;
  openDetail: (item: T) => void;
  closeDetail: () => void;

  deleteTarget: T | null;
  deleting: boolean;
  askDelete: (item: T) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;

  /** Desmarcar pagamento (despesa) ou recebimento (entrada). */
  undoTarget: T | null;
  undoing: boolean;
  askUndo: (item: T) => void;
  cancelUndo: () => void;
  confirmUndo: () => Promise<void>;
}

/**
 * Diálogos e confirmações de uma lista de itens do mês. Despesas e entradas
 * têm exatamente o mesmo conjunto — só mudam os textos e o que cada operação faz.
 */
export function useItemActions<T extends ItemLike>(operations: {
  remove: (id: number) => Promise<boolean>;
  undo: (id: number) => Promise<boolean>;
}): ItemActions<T> {
  const [addOpen, setAddOpen] = useState(false);
  const [settling, setSettling] = useState<T | null>(null);
  const [editing, setEditing] = useState<T | null>(null);
  const [editKey, setEditKey] = useState(0);
  const [detail, setDetail] = useState<T | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [undoTarget, setUndoTarget] = useState<T | null>(null);
  const [undoing, setUndoing] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    if (await operations.remove(deleteTarget.id)) {
      setDeleteTarget(null);
    }
    setDeleting(false);
  }

  async function confirmUndo() {
    if (!undoTarget) return;
    setUndoing(true);
    if (await operations.undo(undoTarget.id)) {
      setUndoTarget(null);
    }
    setUndoing(false);
  }

  return {
    addOpen,
    openAdd: () => setAddOpen(true),
    closeAdd: () => setAddOpen(false),

    settling,
    settleOpen: !!settling,
    openSettle: setSettling,
    closeSettle: () => setSettling(null),

    editing,
    editOpen: !!editing,
    editKey,
    openEdit: (item) => {
      setEditing(item);
      setEditKey((key) => key + 1);
    },
    closeEdit: () => setEditing(null),

    detail,
    detailOpen,
    openDetail: (item) => {
      setDetail(item);
      setDetailOpen(true);
    },
    // O item continua montado enquanto o diálogo fecha, para não piscar vazio.
    closeDetail: () => setDetailOpen(false),

    deleteTarget,
    deleting,
    askDelete: setDeleteTarget,
    cancelDelete: () => setDeleteTarget(null),
    confirmDelete,

    undoTarget,
    undoing,
    askUndo: setUndoTarget,
    cancelUndo: () => setUndoTarget(null),
    confirmUndo,
  };
}
