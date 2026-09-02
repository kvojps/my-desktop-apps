import { z } from 'zod';
import { MAX_KERF_TENTHS_MM, MAX_TRIM_TENTHS_MM } from '@shared/types/project';
import {
  MAX_MEASURE_TENTHS_MM,
  MAX_QUANTITY,
  MIN_MEASURE_TENTHS_MM,
} from '@shared/types/rectangle';

/**
 * O plano que o renderer manda gravar. Ele é o único payload do app que não foi
 * digitado por ninguém — sai do empacotador —, e mesmo assim passa por aqui: a
 * fronteira de confiança é o processo, não a boa-fé do código do outro lado.
 *
 * Os campos não trazem mensagem própria, ao contrário dos de peça e de chapa.
 * Lá a mensagem volta para um formulário aberto e diz o que corrigir; aqui não
 * há o que corrigir — plano malformado é bug do app, não erro de digitação.
 */

/**
 * Medida dentro do plano: aceita zero, ao contrário do lado de um retângulo
 * cadastrado. Coordenada zero é a peça encostada na borda da chapa, que é o
 * caso comum quando não há refile.
 */
const planMeasure = z.number().int().min(0).max(MAX_MEASURE_TENTHS_MM);

/** Lado de um retângulo desenhado: aqui zero não existe, como no cadastro. */
const planSide = z.number().int().min(MIN_MEASURE_TENTHS_MM).max(MAX_MEASURE_TENTHS_MM);

/** Aproveitamento é fração, e fração de área não passa de 1. */
const utilizationSchema = z.number().min(0).max(1);

const placementSchema = z.object({
  label: z.string(),
  lengthTenthsMm: planSide,
  widthTenthsMm: planSide,
  xTenthsMm: planMeasure,
  yTenthsMm: planMeasure,
  rotated: z.boolean(),
});

const plannedSheetSchema = z.object({
  lengthTenthsMm: planSide,
  widthTenthsMm: planSide,
  utilization: utilizationSchema,
  placements: z.array(placementSchema),
});

const shortfallSchema = z.object({
  label: z.string(),
  lengthTenthsMm: planSide,
  widthTenthsMm: planSide,
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
});

const deficitSchema = z.object({
  areaTenthsMm2: z.number().int().min(0),
  referenceSheet: z.object({ lengthTenthsMm: planSide, widthTenthsMm: planSide }).nullable(),
  atLeastSheets: z.number().int().min(0),
});

export const planInputSchema = z.object({
  /**
   * O carimbo do projeto de que este plano saiu. Vem do renderer, e não do
   * banco, de propósito: relê-lo aqui marcaria como atual um plano gerado sobre
   * uma versão anterior do projeto.
   */
  projectUpdatedAt: z.iso.datetime(),
  kerfTenthsMm: z.number().int().min(0).max(MAX_KERF_TENTHS_MM),
  trimTenthsMm: z.number().int().min(0).max(MAX_TRIM_TENTHS_MM),
  utilization: utilizationSchema,
  sheets: z.array(plannedSheetSchema),
  unplaced: z.array(shortfallSchema),
  rejected: z.array(shortfallSchema),
  deficit: deficitSchema,
});
