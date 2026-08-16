import { SellOutlined } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Order } from '@shared/types/order';
import { getOrderProfit, getOrderTotal } from '@shared/types/order';
import { ActionsMenu } from '@/components/ActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { useOrderConfirm } from '@/hooks/orders/useOrderConfirm';
import type { OrderSortKey } from '@/hooks/orders/useOrders';
import { useOrders } from '@/hooks/orders/useOrders';
import { usePagination } from '@/hooks/usePagination';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatPercent } from '@/utils/format';
import { ROUTES } from '../../routes';
import { MonthRangeFilter } from '../dashboard/components/MonthRangeFilter';
import { OrderFilters } from '../orders/components/OrderFilters';
import { OrderViewModal } from '../orders/components/OrderViewModal';
import { PaymentModal } from './components/PaymentModal';
import { PaymentProgress } from './components/PaymentProgress';
import { SalesCards } from './components/SalesCards';

export function SalesPage() {
  const navigate = useNavigate();
  const {
    orders,
    filtered,
    filters,
    sort,
    isLoading,
    setFilters,
    toggleSort,
    setOrderStatus,
    setOrderPaymentAmount,
    deleteOrder,
  } = useOrders();

  const confirm = useOrderConfirm(setOrderStatus, deleteOrder);
  const [viewTarget, setViewTarget] = useState<Order | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Order | null>(null);

  const completedOrders = useMemo(
    () => filtered.filter((o) => o.status === 'completed'),
    [filtered],
  );

  const { page, setPage, totalPages, paginatedItems, start } = usePagination(completedOrders, 10);

  const hasAnySale = useMemo(() => orders.some((o) => o.status === 'completed'), [orders]);

  const columns: Column<Order>[] = useMemo(
    () => [
      {
        key: 'customerName',
        label: 'Cliente',
        sortable: true,
        render: (o: Order) => <strong>{o.customerName}</strong>,
      },
      {
        key: 'items',
        label: 'Itens',
        sortable: false,
        render: (o: Order) => o.items.length,
      },
      {
        key: 'total',
        label: 'Total',
        sortable: true,
        render: (o: Order) => formatCurrency(getOrderTotal(o)),
      },
      {
        key: 'profit',
        label: 'Lucro',
        sortable: false,
        render: (o: Order) => {
          const profit = getOrderProfit(o);
          const total = getOrderTotal(o);
          return (
            <Stack>
              <Typography
                variant="body2"
                color={profit < 0 ? 'error.main' : 'text.primary'}
                sx={{ fontWeight: profit < 0 ? 600 : 400 }}
              >
                {formatCurrency(profit)}
              </Typography>
              {total > 0 && (
                <Typography variant="caption" color="text.disabled">
                  {formatPercent((profit / total) * 100)} de margem
                </Typography>
              )}
            </Stack>
          );
        },
      },
      {
        key: 'paymentStatus',
        label: 'Pagamento',
        sortable: false,
        render: (o: Order) => <PaymentProgress order={o} />,
      },
      {
        key: 'createdAt',
        label: 'Data',
        sortable: true,
        render: (o: Order) => formatDate(o.createdAt),
      },
    ],
    [],
  );

  return (
    <Stack spacing={2}>
      <PageHeader
        icon={<SellOutlined />}
        title="Vendas"
        subtitle="Indicadores e histórico de pedidos concluídos"
      />

      <OrderFilters filters={filters} onChange={setFilters} hideStatusFilter showPaymentFilter>
        <MonthRangeFilter orders={orders} filters={filters} onChange={setFilters} embedded />
      </OrderFilters>

      <SalesCards completedOrders={completedOrders} isLoading={isLoading} />

      <DataTable
        columns={columns}
        items={paginatedItems}
        totalCount={completedOrders.length}
        start={start}
        sort={sort}
        onToggleSort={(key) => toggleSort(key as OrderSortKey)}
        renderActions={(order: Order) => (
          <ActionsMenu
            onView={() => setViewTarget(order)}
            onPayment={() => setPaymentTarget(order)}
            onReopen={() => confirm.setConfirmTarget({ type: 'reopen', order })}
            onDelete={() => confirm.setConfirmTarget({ type: 'delete', order })}
          />
        )}
        getRowKey={(order) => order.id}
        footerLabel="vendas"
        isLoading={isLoading}
        emptyIcon={<SellOutlined sx={{ fontSize: 32 }} />}
        emptyMessage={
          hasAnySale
            ? 'Nenhuma venda corresponde aos filtros.'
            : 'Nenhuma venda concluída ainda. Um pedido vira venda quando você o marca como “Concluído”.'
        }
        emptyAction={
          hasAnySale ? (
            // Só limpa busca e pagamento: o intervalo de meses tem o próprio
            // botão de limpar dentro do MonthRangeFilter, que guarda a seleção
            // em estado local e ficaria dessincronizado se zerado por fora.
            <Button onClick={() => setFilters({ ...filters, search: '', paymentStatus: '' })}>
              Limpar filtros
            </Button>
          ) : (
            <Button variant="contained" onClick={() => navigate(ROUTES.ORDERS)}>
              Ir para Pedidos
            </Button>
          )
        }
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />

      <OrderViewModal
        viewTarget={viewTarget}
        onClose={() => setViewTarget(null)}
        title="Detalhes da Venda"
      />

      <PaymentModal
        order={paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onSave={setOrderPaymentAmount}
      />

      {confirm.confirmTarget &&
        (() => {
          const { title, message, confirmLabel, danger } = confirm.buildProps();
          return (
            <ConfirmDialog
              open
              title={title}
              onConfirm={confirm.handleAction}
              onClose={() => confirm.setConfirmTarget(null)}
              confirmLabel={confirmLabel}
              confirmColor={danger ? 'error' : 'primary'}
              message={message}
            />
          );
        })()}
    </Stack>
  );
}
