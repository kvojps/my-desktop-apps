import { Button, Stack } from '@mui/material';
import { Modal } from '@/components/Modal';
import type { UseCuttingParamsFormReturn } from '@/hooks/projects/useCuttingParamsForm';
import { MeasureField } from './MeasureField';

interface CuttingParamsModalProps {
  formState: UseCuttingParamsFormReturn;
}

export function CuttingParamsModal({ formState }: CuttingParamsModalProps) {
  const { isOpen, isSaving, form, close, onSubmit } = formState;
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title="Parâmetros de corte"
      onSubmit={onSubmit}
      footer={
        <>
          <Button onClick={close} disabled={isSaving} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} variant="contained">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <MeasureField
          label="Kerf"
          autoFocus
          error={!!errors.kerf}
          // A ressalva do glossário: 0,3 é fresa, disco de serra é dez vezes
          // mais. Quem abre o app com outra máquina em mente precisa ler isso.
          helperText={
            errors.kerf?.message ??
            'Quanto a ferramenta come a cada contorno. Fresa fica em 0,3 mm; disco de serra, em 3 a 4 mm.'
          }
          {...register('kerf')}
        />

        <MeasureField
          label="Refile"
          error={!!errors.trim}
          helperText={
            errors.trim?.message ??
            'Margem descartada em cada borda da chapa antes de planejar. Zero se você não refila.'
          }
          {...register('trim')}
        />
      </Stack>
    </Modal>
  );
}
