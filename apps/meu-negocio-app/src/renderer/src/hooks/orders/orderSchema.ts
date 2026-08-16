import { z } from 'zod';
import { parseLocalDate, todayInputValue } from '@/utils/date';

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  productName: z.string(),
  quantity: z
    .string()
    .trim()
    .min(1, 'Quantidade inválida')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Quantidade inválida'),
  unitPrice: z
    .string()
    .trim()
    .min(1, 'Preço inválido')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Preço inválido'),
  unitCost: z.string().trim(),
});

function isNotInTheFuture(value: string): boolean {
  const date = parseLocalDate(value);
  // Data ilegível já é reportada pelo refine anterior, com a mensagem certa.
  if (!date) return true;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return date <= endOfToday;
}

export const orderFormSchema = z
  .object({
    customer: z.string().trim().min(1, 'Nome do cliente é obrigatório'),
    orderDate: z
      .string()
      .trim()
      .min(1, 'Informe a data do pedido')
      .refine((v) => parseLocalDate(v) !== null, 'Data inválida')
      .refine(isNotInTheFuture, 'A data do pedido não pode estar no futuro'),
    items: z.array(orderItemSchema).min(1, 'Adicione pelo menos um item'),
    manualEnabled: z.boolean(),
    manualTotal: z.string().trim(),
  })
  .refine(
    (data) =>
      !data.manualEnabled ||
      (data.manualTotal !== '' &&
        !Number.isNaN(Number(data.manualTotal)) &&
        Number(data.manualTotal) >= 0),
    { message: 'Valor inválido', path: ['manualTotal'] },
  );

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export function emptyOrderItem() {
  return {
    productId: '',
    productName: '',
    quantity: '1',
    unitPrice: '',
    unitCost: '',
  };
}

// É uma função, e não uma constante: o app fica aberto por dias e a data padrão
// precisa ser a de hoje, não a de quando o módulo foi carregado.
export function emptyOrderFormValues(): OrderFormValues {
  return {
    customer: '',
    orderDate: todayInputValue(),
    items: [emptyOrderItem()],
    manualEnabled: false,
    manualTotal: '',
  };
}
