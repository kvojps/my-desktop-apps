import { Add, FilterAltOutlined, ReceiptLongOutlined } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import type { Order, OrderStatus } from '@shared/types/order';
import { getOrderTotal } from '@shared/types/order';
import { ActionsMenu } from '@/components/ActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { useOrderConfirm } from '@/hooks/orders/useOrderConfirm';
import { useOrderForm } from '@/hooks/orders/useOrderForm';
import type { OrderSortKey } from '@/hooks/orders/useOrders';
import { useOrders } from '@/hooks/orders/useOrders';
import { useProducts } from '@/hooks/products/useProducts';
import { usePagination } from '@/hooks/usePagination';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';
import { MonthRangeFilter } from '../dashboard/components/MonthRangeFilter';
import { OrderFilters } from './components/OrderFilters';
import { OrderFormModal } from './components/OrderFormModal';
import { OrderStatusSelect } from './components/OrderStatusSelect';
import { OrderViewModal } from './components/OrderViewModal';

export function OrdersPage() {
  const { products } = useProducts();
  const {
    orders,
    filtered,
    filters,
    sort,
    isLoading,
    error,
    retry,
    setFilters,
    toggleSort,
    addOrder,
    updateOrder,
    setOrderStatus,
    deleteOrder,
  } = useOrders();

  const form = useOrderForm(products, addOrder, updateOrder);
  const confirm = useOrderConfirm(setOrderStatus, deleteOrder);
  const [viewTarget, setViewTarget] = useState<Order | null>(null);

  const activeOrders = useMemo(() => filtered.filter((o) => o.status !== 'completed'), [filtered]);

  // Distingue "ainda não existe pedido em aberto" de "os filtros esconderam
  // todos" — cada caso pede uma saída diferente no estado vazio.
  const hasOpenOrders = useMemo(() => orders.some((o) => o.status !== 'completed'), [orders]);

  const { page, setPage, totalPages, paginatedItems, start } = usePagination(activeOrders, 10);

  const { setConfirmTarget } = confirm;
  const handleStatusChange = useCallback(
    (order: Order, newStatus: OrderStatus) => {
      if (newStatus === order.status) return;
      setConfirmTarget({ type: 'status_change', order, newStatus });
    },
    [setConfirmTarget],
  );

  const columns: Column<Order>[] = useMemo(
    () => [
      {
        key: 'customerName',
        label: 'Cliente',
        sortable: true,
        render: (o: Order) => <strong>{o.customerName}</strong>,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (o: Order) => (
          <OrderStatusSelect value={o.status} onChange={(next) => handleStatusChange(o, next)} />
        ),
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
        key: 'createdAt',
        label: 'Data',
        sortable: true,
        render: (o: Order) => formatDate(o.createdAt),
      },
    ],
    [handleStatusChange],
  );

  if (error && !isLoading) {
    return (
      <ErrorState title="Não foi possível carregar os pedidos" error={error} onRetry={retry} />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<ReceiptLongOutlined />}
        title="Pedidos"
        subtitle="Registro e acompanhamento de pedidos"
        actions={
          // Filtro sobre lista que nunca teve pedido só dá o que filtrar de
          // nada (§4).
          orders.length > 0 && (
            <MonthRangeFilter
              orders={orders}
              filters={filters}
              onChange={setFilters}
              defaultToThisYear={false}
            />
          )
        }
      />

      {orders.length > 0 && (
        <OrderFilters filters={filters} onChange={setFilters} hideStatuses={['completed']}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={form.open}
            sx={{ ml: 'auto' }}
          >
            Novo Pedido
          </Button>
        </OrderFilters>
      )}

      <DataTable
        columns={columns}
        items={paginatedItems}
        totalCount={activeOrders.length}
        start={start}
        sort={sort}
        onToggleSort={(key) => toggleSort(key as OrderSortKey)}
        renderActions={(order: Order) => (
          <ActionsMenu
            ariaLabel={`Ações do pedido de ${order.customerName}`}
            deleteLabel="Excluir pedido"
            onView={() => setViewTarget(order)}
            onEdit={order.status === 'pending' ? () => form.openForEdit(order) : undefined}
            onDelete={
              order.status === 'pending'
                ? () => confirm.setConfirmTarget({ type: 'delete', order })
                : undefined
            }
          />
        )}
        getRowKey={(order) => order.id}
        footerLabel="pedidos"
        isLoading={isLoading}
        empty={
          hasOpenOrders ? (
            <EmptyState
              icon={<FilterAltOutlined sx={{ fontSize: 40 }} />}
              title="Nenhum pedido corresponde aos filtros."
              description="Ajuste a busca, o status ou o período para ver os pedidos em aberto de novo."
              action={
                <Button
                  onClick={() =>
                    setFilters({
                      search: '',
                      status: '',
                      paymentStatus: '',
                      dateFrom: '',
                      dateTo: '',
                    })
                  }
                >
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<ReceiptLongOutlined sx={{ fontSize: 48 }} />}
              title="Nenhum pedido em aberto."
              description="Registre um pedido por cliente e acompanhe o fluxo pendente → em andamento → concluído. As vendas já concluídas ficam na tela de Vendas."
              action={
                <Button variant="contained" startIcon={<Add />} onClick={form.open}>
                  Novo Pedido
                </Button>
              }
            />
          )
        }
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />

      <OrderFormModal formState={form} products={products} />

      <OrderViewModal viewTarget={viewTarget} onClose={() => setViewTarget(null)} />

      {confirm.confirmTarget &&
        (() => {
          const { title, message, confirmLabel, loadingLabel, danger } = confirm.buildProps();
          return (
            <ConfirmDialog
              open
              title={title}
              onConfirm={confirm.handleAction}
              onClose={() => confirm.setConfirmTarget(null)}
              confirmLabel={confirmLabel}
              loadingLabel={loadingLabel}
              loading={confirm.isPending}
              confirmColor={danger ? 'error' : 'primary'}
              message={message}
            />
          );
        })()}
    </Stack>
  );
}
