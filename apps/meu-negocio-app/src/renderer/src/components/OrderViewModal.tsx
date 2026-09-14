import type { Order } from '@shared/types/order';
import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABELS,
  getOrderBalanceDue,
  getOrderPaymentStatus,
  getOrderTotal,
} from '@shared/types/order';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { StatusChip } from '@/components/StatusChip';
import { ORDER_STATUS_ICON, PAYMENT_STATUS_ICON } from '@/components/StatusChip/statusIcons';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

interface OrderViewModalProps {
  viewTarget: Order | null;
  onClose: () => void;
  title?: string;
}

/**
 * O detalhe é o mesmo em Pedidos e em Vendas — só o título muda. As duas telas
 * mostram o mesmo registro, e duplicar a leitura faria as duas divergirem.
 */
export function OrderViewModal({
  viewTarget,
  onClose,
  title = 'Detalhes do Pedido',
}: OrderViewModalProps) {
  const paymentStatus = viewTarget ? getOrderPaymentStatus(viewTarget) : 'unpaid';

  return (
    <Modal
      open={!!viewTarget}
      onClose={onClose}
      title={title}
      maxWidth="600px"
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      {viewTarget && (
        <div className="negocio-stack">
          <dl className="negocio-detail">
            <div>
              <dt>Cliente:</dt>
              <dd>{viewTarget.customerName}</dd>
            </div>
            <div>
              <dt>Status:</dt>
              <dd>
                <StatusChip
                  label={ORDER_STATUS_LABELS[viewTarget.status]}
                  color={ORDER_STATUS_COLOR[viewTarget.status]}
                  icon={ORDER_STATUS_ICON[viewTarget.status]}
                />
              </dd>
            </div>
            <div>
              <dt>Data:</dt>
              <dd>{formatDate(viewTarget.createdAt)}</dd>
            </div>
            <div>
              <dt>Pagamento:</dt>
              <dd>
                <StatusChip
                  label={PAYMENT_STATUS_LABELS[paymentStatus]}
                  color={PAYMENT_STATUS_COLOR[paymentStatus]}
                  icon={PAYMENT_STATUS_ICON[paymentStatus]}
                />
              </dd>
            </div>
            {/* Quitado não tem saldo a mostrar: a linha só apareceria para
                repetir "R$ 0,00 restantes". */}
            {paymentStatus !== 'paid' && (
              <div>
                <dt>Total já pago:</dt>
                <dd>
                  {formatCurrency(viewTarget.amountPaid)} · saldo restante{' '}
                  {formatCurrency(getOrderBalanceDue(viewTarget))}
                </dd>
              </div>
            )}
          </dl>

          <div className="negocio-table-scroll">
            <table className="negocio-table">
              <thead>
                <tr>
                  <th scope="col">Produto</th>
                  <th scope="col">Qtd</th>
                  <th scope="col">Preço Unit.</th>
                  <th scope="col">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {viewTarget.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="negocio-row">
            {viewTarget.manualTotal !== undefined && (
              <span className="negocio-caption">(valor personalizado)</span>
            )}
            <span className="negocio-total">
              Total: {formatCurrency(getOrderTotal(viewTarget))}
            </span>
          </p>
        </div>
      )}
    </Modal>
  );
}
