import { z } from 'zod';

/**
 * Mesmas regras do schema do main (`schemas/projects.schema.ts`), aqui para que
 * o erro apareça no campo em vez de voltar do IPC como snackbar. A validação do
 * main continua sendo a que vale: o preload é código do próprio app, mas o
 * contrato de tipos não sobrevive em runtime.
 */
export const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(120, 'Nome muito longo'),
  material: z.string().trim().min(1, 'Material é obrigatório').max(120, 'Material muito longo'),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const emptyProjectFormValues: ProjectFormValues = {
  name: '',
  material: '',
};
