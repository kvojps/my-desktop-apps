import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@shared/types/product';
import { api } from '@/api/client';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useSnackbar } from './SnackbarContext';

export interface ProductsContextValue {
  products: Product[];
  isLoading: boolean;
  error: unknown;
  retry: () => void;
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { showSnackbar } = useSnackbar();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function refreshProducts() {
    const all = await api.getProducts();
    setProducts(all);
    setError(null);
  }

  function reload() {
    refreshProducts()
      .catch((err) => {
        setError(err);
        showSnackbar('Erro ao carregar os produtos.', 'error');
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDataChanged(reload);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const product = await api.addProduct(data);
    setProducts((prev) => [...prev, product]);
    return product;
  }

  async function updateProduct(id: string, data: Partial<Product>) {
    const updated = await api.updateProduct(id, data);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function deleteProduct(id: string) {
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function getProductById(id: string) {
    return products.find((p) => p.id === id);
  }

  const value = useMemo<ProductsContextValue>(
    () => ({
      products,
      isLoading,
      error,
      retry,
      addProduct,
      updateProduct,
      deleteProduct,
      getProductById,
      refreshProducts,
    }),
    [products, isLoading, error, retry],
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProductsContext(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error('useProductsContext must be used within a ProductsProvider');
  }
  return ctx;
}
