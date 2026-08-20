import { Close } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { Product } from '@shared/types/product';
import { Modal } from '@/components/Modal';
import type { UseOrderFormReturn } from '@/hooks/orders/useOrderForm';
import { todayInputValue } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

/** Cabeçalho e linhas compartilham a mesma grade, para as colunas nunca saírem de registro. */
const ITEM_COLUMNS = 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) 96px 32px';

interface OrderFormModalProps {
  formState: UseOrderFormReturn;
  products: Product[];
}

export function OrderFormModal({ formState, products }: OrderFormModalProps) {
  const {
    isOpen,
    isEditing,
    isSaving,
    form,
    fields,
    displayTotal,
    close,
    onSubmit,
    selectProduct,
    addItem,
    removeItem,
  } = formState;
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const items = watch('items');
  const manualEnabled = watch('manualEnabled');

  // Soma por produto, já que o mesmo produto pode estar em mais de uma linha.
  const requestedByProduct = new Map<string, number>();
  for (const item of items ?? []) {
    if (!item?.productId) continue;
    const current = requestedByProduct.get(item.productId) ?? 0;
    requestedByProduct.set(item.productId, current + (Number(item.quantity) || 0));
  }

  const shortages = [...requestedByProduct]
    .map(([productId, requested]) => ({
      product: products.find((p) => p.id === productId),
      requested,
    }))
    .filter((entry) => entry.product && entry.requested > entry.product.stock)
    .map(
      ({ product, requested }) =>
        `${product!.name} (pedido ${requested}, disponível ${product!.stock})`,
    );

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={isEditing ? 'Editar Pedido' : 'Novo Pedido'}
      maxWidth="600px"
      onSubmit={onSubmit}
      footer={
        <>
          <Button onClick={close} disabled={isSaving} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} variant="contained">
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Pedido'}
          </Button>
        </>
      }
    >
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Cliente"
            required
            error={!!errors.customer}
            helperText={errors.customer?.message}
            placeholder="Nome do cliente"
            sx={{ flex: 2 }}
            {...register('customer')}
          />

          <TextField
            label="Data do pedido"
            type="date"
            required
            error={!!errors.orderDate}
            helperText={errors.orderDate?.message ?? 'Use para lançar pedidos de dias anteriores'}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayInputValue() } }}
            sx={{ flex: 1 }}
            {...register('orderDate')}
          />
        </Stack>

        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1">Itens</Typography>
            <Button size="small" onClick={addItem}>
              + Adicionar Item
            </Button>
          </Stack>

          {/* Quantidade e preço eram duas caixas numéricas nuas, sem rótulo nem
              placeholder: não havia como saber qual era qual sem testar. O
              cabeçalho nomeia as colunas uma vez só, em vez de repetir um label
              dentro de cada linha. */}
          <Box sx={{ display: 'grid', gridTemplateColumns: ITEM_COLUMNS, gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Produto
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Qtd.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Preço unit.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Subtotal
            </Typography>
            <span />
          </Box>

          {fields.map((field, index) => {
            const item = items[index];
            const itemErrors = errors.items?.[index];
            return (
              <Box
                key={field.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: ITEM_COLUMNS,
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <TextField
                  select
                  error={!!itemErrors?.productId}
                  value={item?.productId ?? ''}
                  onChange={(e) => selectProduct(index, e.target.value)}
                  slotProps={{ htmlInput: { 'aria-label': 'Produto' } }}
                >
                  <MenuItem value="">Selecionar produto...</MenuItem>
                  {products.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.salePrice)} · {p.stock} em estoque
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  error={!!itemErrors?.quantity}
                  type="number"
                  slotProps={{ htmlInput: { min: '1', step: '1', 'aria-label': 'Quantidade' } }}
                  {...register(`items.${index}.quantity`)}
                />
                <TextField
                  error={!!itemErrors?.unitPrice}
                  type="number"
                  slotProps={{
                    htmlInput: { min: '0', step: '0.01', 'aria-label': 'Preço unitário' },
                  }}
                  {...register(`items.${index}.unitPrice`)}
                />
                <Typography variant="body2">
                  {formatCurrency((Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0))}
                </Typography>
                <IconButton
                  onClick={() => removeItem(index)}
                  disabled={fields.length <= 1}
                  size="small"
                  aria-label="Remover item"
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            );
          })}

          {shortages.length > 0 && (
            <Alert severity="warning">
              O estoque não cobre este pedido: {shortages.join('; ')}. Você pode registrá-lo assim
              mesmo, mas só conseguirá concluí-lo depois de repor o estoque.
            </Alert>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
          <FormControlLabel
            control={<Checkbox checked={!!manualEnabled} {...register('manualEnabled')} />}
            label="Valor personalizado"
          />

          {manualEnabled && (
            <TextField
              error={!!errors.manualTotal}
              type="number"
              slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
              sx={{ maxWidth: 160 }}
              {...register('manualTotal')}
            />
          )}

          <Typography sx={{ ml: 'auto' }} variant="subtitle1">
            Total: {formatCurrency(displayTotal)}
          </Typography>
        </Stack>
      </Stack>
    </Modal>
  );
}
