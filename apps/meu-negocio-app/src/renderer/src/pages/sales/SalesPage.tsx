import { FilterAltOutlined, SellOutlined } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Order } from '@shared/types/order';
import { getOrderProfit, getOrderTotal } from '@shared/types/order';
import { ActionsMenu } from '@/components/ActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
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
    error,
    retry,
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
        align: 'right',
        render: (o: Order) => o.items.length,
      },
      {
        key: 'total',
        label: 'Total',
        sortable: true,
        align: 'right',
        render: (o: Order) => formatCurrency(getOrderTotal(o)),
      },
      {
        key: 'profit',
        label: 'Lucro',
        sortable: false,
        align: 'right',
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
                <Typography variant="caption" color="text.secondary">
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
        align: 'right',
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

  // Carregando → erro → vazio, nessa ordem. Sem o ramo de erro, um banco que não
  // abre desenhava cinco cards zerados e "Nenhuma venda concluída ainda" — o app
  // dizendo ao usuário que ele não tem vendas quando o que houve foi uma falha.
  if (error && !isLoading) {
    return <ErrorState title="Não foi possível carregar as vendas" error={error} onRetry={retry} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<SellOutlined />}
        title="Vendas"
        subtitle="Indicadores e histórico de pedidos concluídos"
      />

      {hasAnySale && (
        <OrderFilters filters={filters} onChange={setFilters} hideStatusFilter showPaymentFilter>
          <MonthRangeFilter orders={orders} filters={filters} onChange={setFilters} />
        </OrderFilters>
      )}

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
            ariaLabel={`Ações da venda de ${order.customerName}`}
            deleteLabel="Excluir venda"
            onView={() => setViewTarget(order)}
            onPayment={() => setPaymentTarget(order)}
            onReopen={() => confirm.setConfirmTarget({ type: 'reopen', order })}
            onDelete={() => confirm.setConfirmTarget({ type: 'delete', order })}
          />
        )}
        getRowKey={(order) => order.id}
        footerLabel="vendas"
        isLoading={isLoading}
        empty={
          hasAnySale ? (
            <EmptyState
              icon={<FilterAltOutlined sx={{ fontSize: 40 }} />}
              title="Nenhuma venda corresponde aos filtros."
              description="Ajuste a busca, a situação de pagamento ou o período para ver as vendas de novo."
              action={
                // Só limpa busca e pagamento: o intervalo de meses tem o próprio
                // botão de limpar dentro do MonthRangeFilter, que guarda a seleção
                // em estado local e ficaria dessincronizado se zerado por fora.
                <Button onClick={() => setFilters({ ...filters, search: '', paymentStatus: '' })}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<SellOutlined sx={{ fontSize: 48 }} />}
              title="Nenhuma venda concluída ainda."
              description="Um pedido vira venda quando você o marca como Concluído — é nesse momento que o estoque é baixado e o valor entra no caixa."
              action={
                <Button variant="contained" onClick={() => navigate(ROUTES.ORDERS)}>
                  Ir para Pedidos
                </Button>
              }
            />
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
