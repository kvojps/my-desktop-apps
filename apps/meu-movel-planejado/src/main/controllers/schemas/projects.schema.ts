import { z } from 'zod';
import { MAX_KERF_TENTHS_MM, MAX_TRIM_TENTHS_MM } from '@shared/types/project';
import { tenthsToMillimeters } from '@shared/units/measure';

/**
 * O material é rótulo livre (`MDF 15 mm branco`) e não uma escolha de lista: a
 * lista seria de quem escreveu o app, não de quem tem as chapas na parede. Livre
 * não é opcional — é ele que separa um projeto de 15 mm de um de 6 mm, e sem ele
 * a lista de projetos não distingue dois serviços do mesmo cliente.
 */
export const projectInputSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(120, 'Nome muito longo'),
  material: z.string().trim().min(1, 'Material é obrigatório').max(120, 'Material muito longo'),
});

/**
 * Kerf e refile aceitam zero, e por isso não passam pelo `measureSchema`: kerf
 * zero é o corte ideal com que se confere a conta, e refile zero é o default —
 * nem toda oficina refila.
 */
export const cuttingParamsInputSchema = z.object({
  kerfTenthsMm: z
    .number()
    .int('Kerf precisa ser uma medida válida')
    .min(0, 'Kerf não pode ser negativo')
    .max(
      MAX_KERF_TENTHS_MM,
      `Kerf não pode passar de ${tenthsToMillimeters(MAX_KERF_TENTHS_MM)} mm`,
    ),
  trimTenthsMm: z
    .number()
    .int('Refile precisa ser uma medida válida')
    .min(0, 'Refile não pode ser negativo')
    .max(
      MAX_TRIM_TENTHS_MM,
      `Refile não pode passar de ${tenthsToMillimeters(MAX_TRIM_TENTHS_MM)} mm`,
    ),
});
