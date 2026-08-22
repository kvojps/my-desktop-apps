import { Button, Stack, TextField } from '@mui/material';
import { Modal } from '@/components/Modal';
import type { UsePieceFormReturn } from '@/hooks/pieces/usePieceForm';
import { MeasureField } from './MeasureField';

interface PieceFormModalProps {
  formState: UsePieceFormReturn;
}

export function PieceFormModal({ formState }: PieceFormModalProps) {
  const { isOpen, editingId, isSaving, form, close, onSubmit } = formState;
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={editingId ? 'Editar peça' : 'Nova peça'}
      // Torna o papel do diálogo um `<form>`: é o que faz o Enter submeter, já
      // que conteúdo e rodapé moram em slots diferentes (§5.5).
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
        {/* As duas medidas lado a lado: elas são um par, e lidas juntas é que
            dizem o formato do retângulo. */}
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
          helperText={errors.quantity?.message ?? 'Quantas vezes esta peça se repete no serviço.'}
          inputMode="numeric"
          fullWidth
          {...register('quantity')}
        />

        <TextField
          label="Rótulo"
          error={!!errors.label}
          // Sem erro, o campo explica por que ele é opcional.
          helperText={
            errors.label?.message ?? 'Opcional: serve para reconhecer o pedaço depois de cortado.'
          }
          placeholder="lateral do armário"
          fullWidth
          {...register('label')}
        />
      </Stack>
    </Modal>
  );
}
