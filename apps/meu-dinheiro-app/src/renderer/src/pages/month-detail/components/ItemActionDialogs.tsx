import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ItemActions } from '@/pages/month-detail/hooks/useItemActions';

interface ItemActionDialogsProps<T extends { id: number; name: string }> {
  actions: ItemActions<T>;
  /** "despesa" / "entrada" */
  itemNoun: string;
  /** "pagamento" / "recebimento" */
  undoNoun: string;
  /**
   * O que desfazer leva junto, quando leva: o comprovante do pagamento é
   * apagado com ele. A confirmação declara a consequência que se aplica
   * àquele item, e `null` quando não há nenhuma.
   */
  undoConsequence?: (item: T) => string | null;
}

/** As duas confirmações que despesas e entradas compartilham: excluir e desmarcar. */
export function ItemActionDialogs<T extends { id: number; name: string }>({
  actions,
  itemNoun,
  undoNoun,
  undoConsequence,
}: ItemActionDialogsProps<T>) {
  const consequence = actions.undoTarget && undoConsequence?.(actions.undoTarget);

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
        loadingLabel="Excluindo..."
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
            <strong>{actions.undoTarget?.name}</strong>?{consequence ? ` ${consequence}` : ''}
          </>
        }
        confirmLabel="Desmarcar"
        // Neutro, e não vermelho: desmarcar devolve o item ao estado anterior
        // e o registro continua lá — a cor de alarme fica com quem apaga (§1.5).
        confirmTone="neutral"
        loadingLabel="Desmarcando..."
        loading={actions.undoing}
        onClose={actions.cancelUndo}
        onConfirm={actions.confirmUndo}
      />
    </>
  );
}
