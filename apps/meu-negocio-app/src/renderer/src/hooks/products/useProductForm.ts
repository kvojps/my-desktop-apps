import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Product } from '@shared/types/product';
import { getErrorMessage } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { type ProductFormValues, emptyProductFormValues, productFormSchema } from './productSchema';

export function useProductForm(
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>,
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyProductFormValues,
  });

  function openNew() {
    form.reset(emptyProductFormValues);
    setEditingId(null);
    setIsOpen(true);
  }

  function openEdit(product: Product) {
    form.reset({
      name: product.name,
      description: product.description,
      category: product.category,
      supplier: product.supplier,
      costPrice: String(product.costPrice),
      salePrice: String(product.salePrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
    });
    setEditingId(product.id);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setEditingId(null);
    form.reset(emptyProductFormValues);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const data = {
        name: values.name.trim(),
        description: values.description.trim(),
        category: values.category.trim(),
        supplier: values.supplier.trim(),
        costPrice: Number(values.costPrice),
        salePrice: Number(values.salePrice),
        stock: Number(values.stock),
        minStock: values.minStock.trim() ? Number(values.minStock) : 0,
      };

      if (editingId) {
        await updateProduct(editingId, data);
        showToast('Produto atualizado com sucesso.');
      } else {
        await addProduct(data);
        showToast('Produto criado com sucesso.');
      }

      close();
    } catch (err) {
      showToast(getErrorMessage(err, 'Erro ao salvar o produto.'), 'error');
    } finally {
      setIsSaving(false);
    }
  });

  return {
    isOpen,
    editingId,
    isSaving,
    form,
    openNew,
    openEdit,
    close,
    onSubmit,
  };
}

export type UseProductFormReturn = ReturnType<typeof useProductForm>;
