import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { CuttingParamsInput, Project } from '@shared/types/project';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { formatMillimetersValue } from '@/utils/format';
import { fieldToTenths } from '@/utils/measureFields';
import { type CuttingParamsFormValues, cuttingParamsFormSchema } from './cuttingParamsSchema';

/**
 * Kerf e refile existem desde a criação do projeto, com os defaults do
 * glossário, então este formulário só edita — não há o caso "novo" que os
 * outros dois têm.
 */
export function useCuttingParamsForm(save: (data: CuttingParamsInput) => Promise<void>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showError } = useSnackbar();

  const form = useForm<CuttingParamsFormValues>({
    resolver: zodResolver(cuttingParamsFormSchema),
    defaultValues: { kerf: '', trim: '' },
  });

  function open(project: Project) {
    form.reset({
      kerf: formatMillimetersValue(project.kerfTenthsMm),
      trim: formatMillimetersValue(project.trimTenthsMm),
    });
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await save({
        kerfTenthsMm: fieldToTenths(values.kerf),
        trimTenthsMm: fieldToTenths(values.trim),
      });
      close();
    } catch (err) {
      showError(err, 'Erro ao salvar os parâmetros de corte.');
    } finally {
      setIsSaving(false);
    }
  });

  return { isOpen, isSaving, form, open, close, onSubmit };
}

export type UseCuttingParamsFormReturn = ReturnType<typeof useCuttingParamsForm>;
