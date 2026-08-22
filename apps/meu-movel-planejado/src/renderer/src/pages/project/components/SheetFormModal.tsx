import { Button, Stack, TextField } from '@mui/material';
import { Modal } from '@/components/Modal';
import type { UseSheetFormReturn } from '@/hooks/sheets/useSheetForm';
import { MeasureField } from './MeasureField';

interface SheetFormModalProps {
  formState: UseSheetFormReturn;
}

export function SheetFormModal({ formState }: SheetFormModalProps) {
  const { isOpen, editingId, isSaving, form, close, onSubmit } = formState;
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={editingId ? 'Editar chapa' : 'Nova chapa'}
      onSubmit={onSubmit}
      footer={
        <>
          <Button onClick={close} disabled={isSaving} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} variant="contained">
            {isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Adicionar'}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <MeasureField
            label="Comprimento"
            autoFocus
            error={!!errors.length}
            helperText={errors.length?.message}
            placeholder="2750"
            {...register('length')}
          />
          <MeasureField
            label="Largura"
            error={!!errors.width}
            helperText={errors.width?.message}
            placeholder="1850"
            {...register('width')}
          />
        </Stack>

        <TextField
          label="Quantidade"
          required
          error={!!errors.quantity}
          // Sem erro, o campo diz que retalho entra aqui como chapa qualquer —
          // é a explicação de por que existe mais de um tamanho na lista.
          helperText={
            errors.quantity?.message ??
            'Quantas chapas deste tamanho você tem. Retalho entra como chapa, distinguido só pela medida.'
          }
          inputMode="numeric"
          fullWidth
          {...register('quantity')}
        />
      </Stack>
    </Modal>
  );
}
