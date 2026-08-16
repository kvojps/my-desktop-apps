import { Add, Inventory2Outlined } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import type { Product } from '@shared/types/product';
import { getProductMargin, getProductUnitProfit } from '@shared/types/product';
import { ActionsMenu } from '@/components/ActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { StockBadge } from '@/components/StockBadge';
import { useProductConfirm } from '@/hooks/products/useProductConfirm';
import { useProductForm } from '@/hooks/products/useProductForm';
import type { SortKey } from '@/hooks/products/useProducts';
import { useProducts } from '@/hooks/products/useProducts';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency, formatPercent } from '@/utils/format';
import { ProductFilters } from './components/ProductFilters';
import { ProductFormModal } from './components/ProductFormModal';
import { ProductStats } from './components/ProductStats';

export function ProductsPage() {
  const {
    products,
    filtered,
    filters,
    sort,
    isLoading,
    error,
    retry,
    setFilters,
    toggleSort,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();

  const form = useProductForm(addProduct, updateProduct);
  const confirm = useProductConfirm(deleteProduct);

  const { page, setPage, totalPages, paginatedItems, start } = usePagination(filtered, 10);

  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category));
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [products]);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).length,
    [products],
  );

  const columns: Column<Product>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Nome',
        sortable: true,
        render: (p: Product) => <strong>{p.name}</strong>,
      },
      {
        key: 'category',
        label: 'Categoria',
        sortable: true,
        render: (p: Product) => p.category,
      },
      {
        key: 'supplier',
        label: 'Fornecedor',
        sortable: true,
        render: (p: Product) => p.supplier,
      },
      {
        key: 'costPrice',
        label: 'Custo',
        sortable: true,
        render: (p: Product) => formatCurrency(p.costPrice),
      },
      {
        key: 'salePrice',
        label: 'Venda',
        sortable: true,
        render: (p: Product) => formatCurrency(p.salePrice),
      },
      {
        key: 'margin',
        label: 'Margem',
        sortable: true,
        render: (p: Product) => {
          const margin = getProductMargin(p);
          if (margin === undefined) {
            return (
              <Typography variant="body2" color="text.disabled">
                —
              </Typography>
            );
          }
          return (
            <Stack>
              <Typography
                variant="body2"
                // Margem negativa é venda no prejuízo: o único caso da tabela
                // que pede alarme.
                color={margin < 0 ? 'error.main' : 'text.primary'}
                sx={{ fontWeight: margin < 0 ? 600 : 400 }}
              >
                {formatPercent(margin)}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {formatCurrency(getProductUnitProfit(p))} / un
              </Typography>
            </Stack>
          );
        },
      },
      {
        key: 'stock',
        label: 'Estoque',
        sortable: true,
        render: (p: Product) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">{p.stock}</Typography>
            <StockBadge stock={p.stock} minStock={p.minStock} />
          </Stack>
        ),
      },
    ],
    [],
  );

  if (error && !isLoading) {
    return (
      <ErrorState title="Não foi possível carregar os produtos" error={error} onRetry={retry} />
    );
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        icon={<Inventory2Outlined />}
        title="Produtos"
        subtitle="Cadastro e controle de estoque do seu catálogo"
        actions={
          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={form.openNew}
          >
            Novo Produto
          </Button>
        }
      />

      <ProductStats products={products} isLoading={isLoading} />

      <ProductFilters
        filters={filters}
        categories={categories}
        lowStockCount={lowStockCount}
        onChange={setFilters}
      />

      <DataTable
        columns={columns}
        items={paginatedItems}
        totalCount={filtered.length}
        start={start}
        sort={sort}
        onToggleSort={(key) => toggleSort(key as SortKey)}
        renderActions={(product: Product) => (
          <ActionsMenu
            onEdit={() => form.openEdit(product)}
            onDelete={() => confirm.setDeleteTarget(product)}
          />
        )}
        getRowKey={(product) => product.id}
        footerLabel="produtos"
        isLoading={isLoading}
        emptyIcon={<Inventory2Outlined sx={{ fontSize: 32 }} />}
        emptyMessage={
          filtered.length === 0 && products.length > 0
            ? 'Nenhum produto corresponde aos filtros.'
            : 'Seu catálogo ainda está vazio.'
        }
        emptyAction={
          products.length === 0 ? (
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: 16 }} />}
              onClick={form.openNew}
            >
              Cadastrar primeiro produto
            </Button>
          ) : (
            <Button onClick={() => setFilters({ search: '', category: '', lowStockOnly: false })}>
              Limpar filtros
            </Button>
          )
        }
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />

      <ProductFormModal formState={form} />

      {confirm.deleteTarget &&
        (() => {
          const { title, message, confirmLabel, danger } = confirm.buildProps();
          return (
            <ConfirmDialog
              open
              title={title}
              onConfirm={confirm.handleAction}
              onClose={() => confirm.setDeleteTarget(null)}
              confirmLabel={confirmLabel}
              confirmColor={danger ? 'error' : 'primary'}
              message={message}
            />
          );
        })()}
    </Stack>
  );
}
