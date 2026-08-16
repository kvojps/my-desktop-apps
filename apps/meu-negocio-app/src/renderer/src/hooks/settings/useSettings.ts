import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { CompanySettings } from '@shared/types/settings';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
  type SettingsFormValues,
  emptySettingsFormValues,
  formatDocument,
  formatPhone,
  settingsFormSchema,
} from './settingsSchema';

export type { CompanySettings };

export function useSettings() {
  const { showSnackbar, showError } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: emptySettingsFormValues,
  });

  const { reset } = form;

  useEffect(() => {
    let active = true;

    api
      .getSettings()
      .then((settings) => {
        if (active) reset(settings);
      })
      .catch(() => showSnackbar('Erro ao carregar os dados da empresa.', 'error'))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reset, showSnackbar]);

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const data: CompanySettings = {
        name: values.name.trim(),
        cnpj: formatDocument(values.cnpj),
        phone: formatPhone(values.phone),
        address: values.address.trim(),
      };

      const saved = await api.updateSettings(data);
      // Repõe o formulário com o que foi gravado: mostra a máscara aplicada e
      // zera o isDirty, para o botão de salvar voltar a ficar desabilitado.
      reset(saved);
      showSnackbar('Dados da empresa salvos com sucesso.');
    } catch (err) {
      showError(err, 'Erro ao salvar os dados da empresa.');
    } finally {
      setIsSaving(false);
    }
  });

  return { form, isLoading, isSaving, onSubmit };
}

export type UseSettingsReturn = ReturnType<typeof useSettings>;
