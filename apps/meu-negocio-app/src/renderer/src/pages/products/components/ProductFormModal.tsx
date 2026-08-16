import { Button, Stack, TextField } from '@mui/material';
import { Modal } from '@/components/Modal';
import type { UseProductFormReturn } from '@/hooks/products/useProductForm';

interface ProductFormModalProps {
  formState: UseProductFormReturn;
}

export function ProductFormModal({ formState }: ProductFormModalProps) {
  const { isOpen, editingId, isSaving, form, close, onSubmit } = formState;
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={editingId ? 'Editar Produto' : 'Novo Produto'}
      footer={
        <>
          <Button onClick={close} disabled={isSaving} color="inherit">
            Cancelar
          </Button>
          <Button onClick={() => onSubmit()} disabled={isSaving} variant="contained">
            {isSaving ? 'Salvando…' : editingId ? 'Salvar' : 'Criar'}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <TextField
          label="Nome"
          required
          error={!!errors.name}
          helperText={errors.name?.message}
          placeholder="Nome do produto"
          fullWidth
          {...register('name')}
        />

        <TextField
          label="Descrição"
          placeholder="Descrição do produto (opcional)"
          multiline
          rows={3}
          fullWidth
          {...register('description')}
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label="Categoria"
            required
            error={!!errors.category}
            helperText={errors.category?.message}
            placeholder="Ex: Vestuário"
            fullWidth
            {...register('category')}
          />

          <TextField
            label="Fornecedor"
            placeholder="Nome do fornecedor"
            fullWidth
            {...register('supplier')}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Preço de Custo"
            required
            error={!!errors.costPrice}
            helperText={errors.costPrice?.message}
            placeholder="0,00"
            type="number"
            slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
            fullWidth
            {...register('costPrice')}
          />

          <TextField
            label="Preço de Venda"
            required
            error={!!errors.salePrice}
            helperText={errors.salePrice?.message}
            placeholder="0,00"
            type="number"
            slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
            fullWidth
            {...register('salePrice')}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Estoque"
            required
            error={!!errors.stock}
            helperText={errors.stock?.message}
            placeholder="0"
            type="number"
            slotProps={{ htmlInput: { step: '1', min: '0' } }}
            fullWidth
            {...register('stock')}
          />

          <TextField
            label="Estoque Mínimo"
            placeholder="0"
            type="number"
            slotProps={{ htmlInput: { step: '1', min: '0' } }}
            fullWidth
            {...register('minStock')}
          />
        </Stack>
      </Stack>
    </Modal>
  );
}
