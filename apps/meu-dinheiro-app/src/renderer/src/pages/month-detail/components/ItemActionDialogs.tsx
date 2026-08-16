import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ItemActions } from '../hooks/useItemActions';

interface ItemActionDialogsProps<T extends { id: number; name: string }> {
  actions: ItemActions<T>;
  /** "despesa" / "entrada" */
  itemNoun: string;
  /** "pagamento" / "recebimento" */
  undoNoun: string;
}

/** As duas confirmações que despesas e entradas compartilham: excluir e desmarcar. */
export function ItemActionDialogs<T extends { id: number; name: string }>({
  actions,
  itemNoun,
  undoNoun,
}: ItemActionDialogsProps<T>) {
  return (
    <>
      <ConfirmDialog
        open={!!actions.deleteTarget}
        title={`Excluir ${itemNoun}?`}
        message={
          <>
            Tem certeza que deseja excluir <strong>{actions.deleteTarget?.name}</strong>? Essa ação
            não pode ser desfeita.
          </>
        }
        loading={actions.deleting}
        onClose={actions.cancelDelete}
        onConfirm={actions.confirmDelete}
      />

      <ConfirmDialog
        open={!!actions.undoTarget}
        title={`Desmarcar ${undoNoun}?`}
        message={
          <>
            Tem certeza que deseja desmarcar o {undoNoun} de{' '}
            <strong>{actions.undoTarget?.name}</strong>?
          </>
        }
        confirmLabel="Desmarcar"
        confirmColor="warning"
        loading={actions.undoing}
        onClose={actions.cancelUndo}
        onConfirm={actions.confirmUndo}
      />
    </>
  );
}
