import { z } from 'zod';

const requiredPositiveNumber = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório`)
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, `${label} inválido`);

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  description: z.string().trim(),
  category: z.string().trim().min(1, 'Categoria é obrigatória'),
  supplier: z.string().trim(),
  costPrice: requiredPositiveNumber('Preço de custo'),
  salePrice: requiredPositiveNumber('Preço de venda'),
  stock: z
    .string()
    .trim()
    .min(1, 'Estoque é obrigatório')
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number.isInteger(Number(v)) && Number(v) >= 0,
      'Estoque inválido',
    ),
  minStock: z.string().trim(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const emptyProductFormValues: ProductFormValues = {
  name: '',
  description: '',
  category: '',
  supplier: '',
  costPrice: '',
  salePrice: '',
  stock: '',
  minStock: '',
};
