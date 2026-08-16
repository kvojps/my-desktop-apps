import { z } from 'zod';

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Aceita CNPJ (14 dígitos) ou CPF (11), já que MEI e autônomo usam um ou outro. */
export function formatDocument(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return value.trim();
}

export function formatPhone(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return value.trim();
}

export const settingsFormSchema = z.object({
  // Obrigatório porque é o cabeçalho de todo documento gerado a partir daqui.
  name: z.string().trim().min(1, 'Nome da empresa é obrigatório'),
  cnpj: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || onlyDigits(v).length === 14 || onlyDigits(v).length === 11,
      'Informe um CNPJ (14 dígitos) ou CPF (11 dígitos)',
    ),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || onlyDigits(v).length === 10 || onlyDigits(v).length === 11,
      'Informe DDD e número, ex: (11) 91234-5678',
    ),
  address: z.string().trim(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export const emptySettingsFormValues: SettingsFormValues = {
  name: '',
  cnpj: '',
  phone: '',
  address: '',
};
