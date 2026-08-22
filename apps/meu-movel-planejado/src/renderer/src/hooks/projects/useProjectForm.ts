import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Project, ProjectInput } from '@shared/types/project';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { type ProjectFormValues, emptyProjectFormValues, projectFormSchema } from './projectSchema';

/**
 * O mesmo formulário cria e edita: nome e material são os dois rótulos do
 * serviço, e corrigir `MDF 15mm` para `MDF 15 mm branco` não deveria custar um
 * projeto novo.
 */
export function useProjectForm(
  createProject: (data: ProjectInput) => Promise<void>,
  updateProject: (id: string, data: ProjectInput) => Promise<void>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showError } = useSnackbar();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: emptyProjectFormValues,
  });

  function openNew() {
    form.reset(emptyProjectFormValues);
    setEditingId(null);
    setIsOpen(true);
  }

  function openEdit(project: Project) {
    form.reset({ name: project.name, material: project.material });
    setEditingId(project.id);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setEditingId(null);
    form.reset(emptyProjectFormValues);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const data: ProjectInput = {
        name: values.name.trim(),
        material: values.material.trim(),
      };

      if (editingId) {
        await updateProject(editingId, data);
      } else {
        await createProject(data);
      }

      close();
    } catch (err) {
      showError(err, 'Erro ao salvar o projeto.');
    } finally {
      setIsSaving(false);
    }
  });

  return { isOpen, editingId, isSaving, form, openNew, openEdit, close, onSubmit };
}

export type UseProjectFormReturn = ReturnType<typeof useProjectForm>;
