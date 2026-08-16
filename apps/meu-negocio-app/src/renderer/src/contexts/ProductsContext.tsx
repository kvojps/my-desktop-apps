import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@shared/types/product';
import { call } from '@/api/client';
import { useToast } from './ToastContext';

export interface ProductsContextValue {
  products: Product[];
  isLoading: boolean;
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshProducts() {
    const all = await call(() => window.api.products.getAll());
    setProducts(all);
  }

  useEffect(() => {
    refreshProducts()
      .catch(() => showToast('Erro ao carregar os produtos.', 'error'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const product = await call(() => window.api.products.add(data));
    setProducts((prev) => [...prev, product]);
    return product;
  }

  async function updateProduct(id: string, data: Partial<Product>) {
    const updated = await call(() => window.api.products.update(id, data));
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function deleteProduct(id: string) {
    await call(() => window.api.products.delete(id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function getProductById(id: string) {
    return products.find((p) => p.id === id);
  }

  const value = useMemo<ProductsContextValue>(
    () => ({
      products,
      isLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      getProductById,
      refreshProducts,
    }),
    [products, isLoading],
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
