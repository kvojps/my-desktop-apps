import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { CompanySettings } from '@shared/types/settings';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useDataChanged } from '@/hooks/useDataChanged';
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
  // A falha ao carregar era só um snackbar, que some: o formulário ficava
  // vazio e editável, e salvar por cima gravaria em branco o que não chegou a
  // ser lido. Agora a seção mostra o erro e oferece tentar de novo (§5.3).
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: emptySettingsFormValues,
  });

  const { reset } = form;

  const reload = useCallback(async () => {
    try {
      const settings = await api.getSettings();
      reset(settings);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  useDataChanged(reload);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

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

  return { form, isLoading, isSaving, error, retry, onSubmit };
}

export type UseSettingsReturn = ReturnType<typeof useSettings>;
