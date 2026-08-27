import { z } from 'zod';

export const orderStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

const orderItemSchema = z.object({
  id: z.string().min(1, 'Identificador do item é obrigatório'),
  productId: z.string().min(1, 'Produto do item é obrigatório'),
  productName: z.string().min(1, 'Nome do produto do item é obrigatório'),
  quantity: z
    .number()
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser maior que zero'),
  unitPrice: z.number().nonnegative('Preço unitário não pode ser negativo'),
  unitCost: z.number().nonnegative('Custo unitário não pode ser negativo'),
});

/**
 * Data do pedido informada pelo usuário. Aceita qualquer data passada — lançar
 * pedidos de dias anteriores é o caso de uso — mas nunca uma data futura, que
 * só pode ser erro de digitação.
 *
 * A regra é de dia, não de instante: um pedido de hoje chega com o horário do
 * relógio do renderer, que pode estar alguns milissegundos à frente do relógio
 * lido aqui. Comparar com `Date.now()` recusava, como futura, uma venda
 * lançada agora.
 */
const orderDateSchema = z.iso
  .datetime({ message: 'Data do pedido inválida' })
  .refine(
    (value) => {
      const time = new Date(value).getTime();
      // Formato já reportado pelo check acima; não duplicar o erro aqui.
      if (Number.isNaN(time)) return true;
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      return time <= endOfToday.getTime();
    },
    { message: 'A data do pedido não pode estar no futuro' },
  )
  .optional();

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(1, 'Nome do cliente é obrigatório'),
  status: orderStatusSchema,
  items: z.array(orderItemSchema),
  manualTotal: z.number().nonnegative('Total manual não pode ser negativo').optional(),
  amountPaid: z.number().nonnegative('Valor pago não pode ser negativo'),
  createdAt: orderDateSchema,
});

export const updateOrderSchema = createOrderSchema.omit({ status: true });

export const paymentAmountSchema = z.number().nonnegative('Valor pago não pode ser negativo');
