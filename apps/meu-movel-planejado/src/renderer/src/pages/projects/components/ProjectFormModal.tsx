import { Button, Stack, TextField } from '@mui/material';
import { Modal } from '@/components/Modal';
import type { UseProjectFormReturn } from '@/hooks/projects/useProjectForm';

interface ProjectFormModalProps {
  formState: UseProjectFormReturn;
}

export function ProjectFormModal({ formState }: ProjectFormModalProps) {
  const { isOpen, editingId, isSaving, form, close, onSubmit } = formState;
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={editingId ? 'Editar projeto' : 'Novo projeto'}
      // Torna o papel do diálogo um `<form>`: é o que faz o Enter submeter, já
      // que conteúdo e rodapé moram em slots diferentes e o botão não estaria
      // dentro de formulário nenhum (§5.5).
      onSubmit={onSubmit}
      footer={
        <>
          <Button onClick={close} disabled={isSaving} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} variant="contained">
            {isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <TextField
          label="Nome"
          required
          autoFocus
          error={!!errors.name}
          helperText={errors.name?.message}
          placeholder="Cozinha da Dona Marta"
          fullWidth
          {...register('name')}
        />

        <TextField
          label="Material"
          required
          error={!!errors.material}
          // Sem erro, o campo explica por que ele é livre em vez de uma lista.
          helperText={
            errors.material?.message ?? 'Descreva a chapa bruta do serviço, do seu jeito.'
          }
          placeholder="MDF 15 mm branco"
          fullWidth
          {...register('material')}
        />
      </Stack>
    </Modal>
  );
}
