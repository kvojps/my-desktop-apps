import { useState } from 'react';
import type { OrderStatus } from '@shared/types/order';
import { ORDER_STATUS_LABELS } from '@shared/types/order';
import type { Order } from '@shared/types/order';
import { getErrorMessage } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';

interface ConfirmTarget {
  type: 'advance' | 'cancel' | 'reopen' | 'delete' | 'status_change';
  order: Order;
  newStatus?: OrderStatus;
}

interface ConfirmProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
}

export type UseOrderConfirmReturn = {
  confirmTarget: ConfirmTarget | null;
  setConfirmTarget: (target: ConfirmTarget | null) => void;
  buildProps: () => ConfirmProps;
  handleAction: () => Promise<void>;
};

export function useOrderConfirm(
  setOrderStatus: (id: string, status: OrderStatus) => Promise<void>,
  deleteOrder: (id: string) => Promise<void>,
): UseOrderConfirmReturn {
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const { showToast } = useToast();

  function buildProps(): ConfirmProps {
    const { type, order } = confirmTarget!;

    switch (type) {
      case 'advance': {
        const next = order.status === 'pending' ? 'Em andamento' : 'Concluído';
        return {
          title: `Avançar para "${next}"`,
          message: `Tem certeza que deseja avançar o pedido de ${order.customerName} para "${next}"?`,
          confirmLabel: `Avançar para "${next}"`,
          danger: false,
        };
      }
      case 'cancel':
        return {
          title: 'Cancelar Pedido',
          message: `Tem certeza que deseja cancelar o pedido de ${order.customerName}?`,
          confirmLabel: 'Confirmar Cancelamento',
          danger: false,
        };
      case 'reopen':
        return {
          title: 'Reabrir Pedido',
          message: `O pedido de ${order.customerName} deixa de ser uma venda e volta para a tela de Pedidos como pendente, com o estoque devolvido. O valor já pago é mantido.`,
          confirmLabel: 'Reabrir Pedido',
          danger: false,
        };
      case 'delete': {
        const stockNote =
          order.status === 'completed' ? ' O estoque dos itens será devolvido.' : '';
        return {
          title: 'Excluir Pedido',
          message: `Tem certeza que deseja excluir o pedido de ${order.customerName}? Esta ação não pode ser desfeita.${stockNote}`,
          confirmLabel: 'Confirmar Exclusão',
          danger: true,
        };
      }
      case 'status_change': {
        const label = ORDER_STATUS_LABELS[confirmTarget!.newStatus!];
        return {
          title: 'Alterar Status',
          message: `Tem certeza que deseja alterar o status do pedido de ${order.customerName} para "${label}"?`,
          confirmLabel: `Alterar para "${label}"`,
          danger: confirmTarget!.newStatus === 'cancelled',
        };
      }
    }
  }

  async function handleAction() {
    if (!confirmTarget) return;

    const { type, order } = confirmTarget;

    try {
      switch (type) {
        case 'advance':
          if (order.status === 'pending') await setOrderStatus(order.id, 'in_progress');
          else if (order.status === 'in_progress') await setOrderStatus(order.id, 'completed');
          showToast('Status do pedido atualizado.');
          break;
        case 'cancel':
          await setOrderStatus(order.id, 'cancelled');
          showToast('Pedido cancelado.', 'info');
          break;
        case 'reopen':
          // Volta como pendente, e não "em andamento", porque quem reabre uma
          // venda quase sempre quer corrigi-la — e só pendentes são editáveis.
          await setOrderStatus(order.id, 'pending');
          showToast('Pedido reaberto.');
          break;
        case 'delete':
          await deleteOrder(order.id);
          showToast('Pedido excluído.', 'info');
          break;
        case 'status_change':
          await setOrderStatus(order.id, confirmTarget.newStatus!);
          showToast('Status do pedido atualizado.');
          break;
      }

      setConfirmTarget(null);
    } catch (err) {
      showToast(getErrorMessage(err, 'Erro ao atualizar o pedido.'), 'error');
    }
  }

  return {
    confirmTarget,
    setConfirmTarget,
    buildProps,
    handleAction,
  };
}
