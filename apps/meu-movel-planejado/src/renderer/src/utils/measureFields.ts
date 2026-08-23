import { z } from 'zod';
import { MAX_QUANTITY, type Rectangle } from '@shared/types/rectangle';
import { millimetersToTenths, parseMillimeters, tenthsToMillimeters } from '@shared/units/measure';

/**
 * Os campos que peça, chapa e parâmetros de corte têm em comum, do lado do
 * formulário. É o par de `main/schemas/rectangle.schema.ts`: lá a fronteira
 * recebe décimo de milímetro já convertido, aqui se recebe o que foi digitado.
 *
 * Medida é `string` no formulário, e não `number`, porque o que o usuário
 * digita passa por estados que não são número — `2750,` enquanto ele escreve a
 * casa decimal. Convertê-la a cada tecla apagaria a vírgula debaixo do cursor.
 *
 * As mensagens não flexionam gênero ("não pode ficar em branco", e não
 * "obrigatório") e não nomeiam peça nem chapa: o mesmo helper serve o
 * comprimento e a largura das duas, e peça e chapa são coisas que o glossário
 * mantém separadas.
 */

function formatLimit(tenths: number): string {
  return tenthsToMillimeters(tenths).toLocaleString('pt-BR');
}

function reject(ctx: z.RefinementCtx, message: string): void {
  ctx.addIssue({ code: 'custom', message });
}

interface MeasureFieldOptions {
  /** Como o campo se chama na tela, para a mensagem dizer qual deles falhou. */
  label: string;
  /** Teto em décimo de milímetro, o mesmo que o main aplica. */
  max: number;
  /**
   * Kerf e refile aceitam zero — kerf zero é o corte ideal com que se confere a
   * conta, e refile zero é o default. Lado de retângulo, não: zero não é medida.
   */
  allowZero?: boolean;
}

export function measureFieldSchema({ label, max, allowZero = false }: MeasureFieldOptions) {
  return z.string().superRefine((value, ctx) => {
    const trimmed = value.trim();
    if (!trimmed) return reject(ctx, `${label} não pode ficar em branco`);

    const millimeters = parseMillimeters(trimmed);
    if (millimeters === null) return reject(ctx, 'Use milímetro com no máximo uma casa decimal');

    const tenths = millimetersToTenths(millimeters);
    if (!allowZero && tenths === 0) return reject(ctx, `${label} precisa ser maior que zero`);
    if (tenths > max) return reject(ctx, `${label} não pode passar de ${formatLimit(max)} mm`);
  });
}

export const quantityFieldSchema = z.string().superRefine((value, ctx) => {
  const trimmed = value.trim();
  if (!trimmed) return reject(ctx, 'Quantidade não pode ficar em branco');
  if (!/^\d+$/.test(trimmed)) return reject(ctx, 'Quantidade é um número inteiro');
  if (Number(trimmed) < 1) return reject(ctx, 'Quantidade precisa ser pelo menos 1');
  if (Number(trimmed) > MAX_QUANTITY) {
    return reject(ctx, `Quantidade não pode passar de ${MAX_QUANTITY}`);
  }
});

/**
 * O valor digitado na unidade do domínio. Só chame depois de o resolver ter
 * passado — o `?? 0` é o ramo que a validação já tornou inalcançável.
 */
export function fieldToTenths(value: string): number {
  return millimetersToTenths(parseMillimeters(value) ?? 0);
}

/**
 * O retângulo que está digitado **agora**, ou `null` enquanto o par ainda não é
 * medida. É o par de `fieldToTenths` para quem precisa da resposta **antes** do
 * resolver: o texto pela metade e o zero não são retângulo, e medi-los acusaria
 * uma peça que ninguém terminou de escrever.
 */
export function fieldsToRectangle(length: string, width: string): Rectangle | null {
  const lengthMm = parseMillimeters(length);
  const widthMm = parseMillimeters(width);
  if (!lengthMm || !widthMm) return null;
  return {
    lengthTenthsMm: millimetersToTenths(lengthMm),
    widthTenthsMm: millimetersToTenths(widthMm),
  };
}
