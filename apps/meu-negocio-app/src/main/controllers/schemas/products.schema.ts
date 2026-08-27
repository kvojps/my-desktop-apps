import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Nome do produto é obrigatório'),
  description: z.string(),
  category: z.string().trim().min(1, 'Categoria é obrigatória'),
  supplier: z.string(),
  costPrice: z.number().nonnegative('Preço de custo não pode ser negativo'),
  salePrice: z.number().nonnegative('Preço de venda não pode ser negativo'),
  stock: z
    .number()
    .int('Estoque deve ser um número inteiro')
    .nonnegative('Estoque não pode ser negativo'),
  minStock: z
    .number()
    .int('Estoque mínimo deve ser um número inteiro')
    .nonnegative('Estoque mínimo não pode ser negativo'),
});

export const updateProductSchema = createProductSchema.partial();
