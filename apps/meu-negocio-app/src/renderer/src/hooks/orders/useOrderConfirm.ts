import { useState } from 'react';
import type { OrderStatus } from '@shared/types/order';
import { ORDER_STATUS_LABELS } from '@shared/types/order';
import type { Order } from '@shared/types/order';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface ConfirmTarget {
  type: 'advance' | 'cancel' | 'reopen' | 'delete' | 'status_change';
  order: Order;
  newStatus?: OrderStatus;
}

interface ConfirmProps {
  title: string;
  message: string;
  confirmLabel: string;
  /** Rótulo enquanto o IPC não volta — ação em andamento troca o rótulo (§5.3). */
  loadingLabel: string;
  danger: boolean;
}

export type UseOrderConfirmReturn = {
  confirmTarget: ConfirmTarget | null;
  setConfirmTarget: (target: ConfirmTarget | null) => void;
  /** A ação está em andamento: o botão de confirmar não pode seguir clicável. */
  isPending: boolean;
  buildProps: () => ConfirmProps;
  handleAction: () => Promise<void>;
};

export function useOrderConfirm(
  setOrderStatus: (id: string, status: OrderStatus) => Promise<void>,
  deleteOrder: (id: string) => Promise<void>,
): UseOrderConfirmReturn {
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { showSnackbar, showError } = useSnackbar();

  function buildProps(): ConfirmProps {
    const { type, order } = confirmTarget!;

    switch (type) {
      case 'advance': {
        const next = order.status === 'pending' ? 'Em andamento' : 'Concluído';
        return {
          title: `Avançar para "${next}"`,
          message: `Tem certeza que deseja avançar o pedido de ${order.customerName} para "${next}"?`,
          confirmLabel: `Avançar para "${next}"`,
          loadingLabel: 'Avançando...',
          danger: false,
        };
      }
      case 'cancel':
        return {
          title: 'Cancelar Pedido',
          message: `Tem certeza que deseja cancelar o pedido de ${order.customerName}?`,
          confirmLabel: 'Confirmar Cancelamento',
          loadingLabel: 'Cancelando...',
          danger: false,
        };
      case 'reopen':
        return {
          title: 'Reabrir Pedido',
          message: `O pedido de ${order.customerName} deixa de ser uma venda e volta para a tela de Pedidos como pendente, com o estoque devolvido. O valor já pago é mantido.`,
          confirmLabel: 'Reabrir Pedido',
          loadingLabel: 'Reabrindo...',
          danger: false,
        };
      case 'delete': {
        const stockNote =
          order.status === 'completed' ? ' O estoque dos itens será devolvido.' : '';
        return {
          title: 'Excluir Pedido',
          message: `Tem certeza que deseja excluir o pedido de ${order.customerName}? Esta ação não pode ser desfeita.${stockNote}`,
          confirmLabel: 'Confirmar Exclusão',
          loadingLabel: 'Excluindo...',
          danger: true,
        };
      }
      case 'status_change': {
        const label = ORDER_STATUS_LABELS[confirmTarget!.newStatus!];
        return {
          title: 'Alterar Status',
          message: `Tem certeza que deseja alterar o status do pedido de ${order.customerName} para "${label}"?`,
          confirmLabel: `Alterar para "${label}"`,
          loadingLabel: 'Alterando...',
          danger: confirmTarget!.newStatus === 'cancelled',
        };
      }
    }
  }

  async function handleAction() {
    if (!confirmTarget) return;

    const { type, order } = confirmTarget;

    setIsPending(true);
    try {
      switch (type) {
        case 'advance':
          if (order.status === 'pending') await setOrderStatus(order.id, 'in_progress');
          else if (order.status === 'in_progress') await setOrderStatus(order.id, 'completed');
          showSnackbar('Status do pedido atualizado.');
          break;
        case 'cancel':
          await setOrderStatus(order.id, 'cancelled');
          showSnackbar('Pedido cancelado.', 'info');
          break;
        case 'reopen':
          // Volta como pendente, e não "em andamento", porque quem reabre uma
          // venda quase sempre quer corrigi-la — e só pendentes são editáveis.
          await setOrderStatus(order.id, 'pending');
          showSnackbar('Pedido reaberto.');
          break;
        case 'delete':
          await deleteOrder(order.id);
          showSnackbar('Pedido excluído.', 'info');
          break;
        case 'status_change':
          await setOrderStatus(order.id, confirmTarget.newStatus!);
          showSnackbar('Status do pedido atualizado.');
          break;
      }

      setConfirmTarget(null);
    } catch (err) {
      showError(err, 'Erro ao atualizar o pedido.');
    } finally {
      setIsPending(false);
    }
  }

  return {
    confirmTarget,
    setConfirmTarget,
    isPending,
    buildProps,
    handleAction,
  };
}
