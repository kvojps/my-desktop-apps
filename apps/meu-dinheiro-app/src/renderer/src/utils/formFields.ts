import { z } from 'zod';

// Campos de formulário zod compartilhados por schemas de mais de um domínio:
// `optionalNumberField` valida saldo de conta e valores de despesa/entrada;
// `optionalDayField`, o dia do mês de despesas e entradas padrão. Módulo puro em
// `utils/` porque nenhum `hooks/<domínio>/` é dono sozinho (README, §2.4).

export const optionalNumberField = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || !Number.isNaN(Number(v)), `${label} inválido`);

export const optionalDayField = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 31),
      `${label} deve ser um dia entre 1 e 31`,
    );
