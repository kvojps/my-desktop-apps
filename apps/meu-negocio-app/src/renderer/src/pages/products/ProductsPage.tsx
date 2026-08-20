import { Add, FilterAltOutlined, Inventory2Outlined } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import type { Product } from '@shared/types/product';
import { getProductMargin, getProductUnitProfit } from '@shared/types/product';
import { ActionsMenu } from '@/components/ActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
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
        align: 'right',
        render: (p: Product) => formatCurrency(p.costPrice),
      },
      {
        key: 'salePrice',
        label: 'Venda',
        sortable: true,
        align: 'right',
        render: (p: Product) => formatCurrency(p.salePrice),
      },
      {
        key: 'margin',
        label: 'Margem',
        sortable: true,
        align: 'right',
        render: (p: Product) => {
          const margin = getProductMargin(p);
          if (margin === undefined) {
            // Valor ausente é conteúdo, não controle desabilitado: vai em
            // `text.secondary`, que passa em AA nos dois modos (§1.4).
            return (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            );
          }
          return (
            <Stack>
              <Typography
                variant="body2"
                // Margem negativa é venda no prejuízo: o único caso da tabela
                // que pede alarme. Numa coluna, só a condição que pede atenção
                // é pintada (§1.5).
                color={margin < 0 ? 'error.main' : 'text.primary'}
                sx={{ fontWeight: margin < 0 ? 600 : 400 }}
              >
                {formatPercent(margin)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
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

  // Filtro sobre catálogo que nunca teve produto só dá o que filtrar de nada; a
  // tela nesse momento tem uma coisa a dizer, que é o estado vazio (§4).
  const hasProducts = products.length > 0;

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<Inventory2Outlined />}
        title="Produtos"
        subtitle="Cadastro e controle de estoque do seu catálogo"
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={form.openNew}>
            Novo Produto
          </Button>
        }
      />

      <ProductStats products={products} isLoading={isLoading} />

      {hasProducts && (
        <ProductFilters
          filters={filters}
          categories={categories}
          lowStockCount={lowStockCount}
          onChange={setFilters}
        />
      )}

      <DataTable
        columns={columns}
        items={paginatedItems}
        totalCount={filtered.length}
        start={start}
        sort={sort}
        onToggleSort={(key) => toggleSort(key as SortKey)}
        renderActions={(product: Product) => (
          <ActionsMenu
            ariaLabel={`Ações de ${product.name}`}
            deleteLabel="Excluir produto"
            onEdit={() => form.openEdit(product)}
            onDelete={() => confirm.setDeleteTarget(product)}
          />
        )}
        getRowKey={(product) => product.id}
        footerLabel="produtos"
        isLoading={isLoading}
        empty={
          // Um só predicado decide a frase e a ação: antes a mensagem olhava
          // para o filtro e o botão olhava para o catálogo, então um catálogo
          // cheio com filtro que não acha nada dizia "corresponde aos filtros"
          // e oferecia "Limpar filtros" — mas o inverso também podia acontecer.
          hasProducts ? (
            <EmptyState
              icon={<FilterAltOutlined sx={{ fontSize: 40 }} />}
              title="Nenhum produto corresponde aos filtros."
              description="Ajuste a busca, a categoria ou o filtro de estoque baixo para ver o catálogo de novo."
              action={
                <Button
                  onClick={() => setFilters({ search: '', category: '', lowStockOnly: false })}
                >
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Inventory2Outlined sx={{ fontSize: 48 }} />}
              title="Seu catálogo ainda está vazio."
              description="Cadastre os produtos com preço de custo, preço de venda e estoque — é deles que saem a margem, o capital parado e os alertas de reposição."
              action={
                <Button variant="contained" startIcon={<Add />} onClick={form.openNew}>
                  Novo Produto
                </Button>
              }
            />
          )
        }
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />

      <ProductFormModal formState={form} />

      {confirm.deleteTarget &&
        (() => {
          const { title, message, confirmLabel, loadingLabel, danger } = confirm.buildProps();
          return (
            <ConfirmDialog
              open
              title={title}
              onConfirm={confirm.handleAction}
              onClose={() => confirm.setDeleteTarget(null)}
              confirmLabel={confirmLabel}
              loadingLabel={loadingLabel}
              loading={confirm.isDeleting}
              confirmColor={danger ? 'error' : 'primary'}
              message={message}
            />
          );
        })()}
    </Stack>
  );
}
