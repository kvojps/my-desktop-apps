import { tenthsMm2ToSquareMeters } from '@shared/units/area';
import { tenthsToMillimeters } from '@shared/units/measure';

/**
 * Uma casa decimal, sempre, e sem separador de milhar: `2750,0 mm`. A casa fixa
 * é o que faz `2750,0` e `1850,5` terem a mesma largura numa coluna de dígito
 * tabular; o milhar ficaria no caminho porque medida de marcenaria tem quatro
 * dígitos e se lê inteira, não em grupos.
 */
const millimeterFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  useGrouping: false,
});

const squareMeterFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** A unidade do domínio na unidade da tela, ex. `2750,0 mm`. */
export function formatMillimeters(tenths: number): string {
  return `${millimeterFormatter.format(tenthsToMillimeters(tenths))} mm`;
}

/** Sem a unidade: para o campo de formulário, que já traz `mm` no adorno. */
export function formatMillimetersValue(tenths: number): string {
  return millimeterFormatter.format(tenthsToMillimeters(tenths));
}

/** Área na unidade em que se compara serviço com estoque, ex. `5,09 m²`. */
export function formatSquareMeters(areaTenthsMm2: number): string {
  return `${squareMeterFormatter.format(tenthsMm2ToSquareMeters(areaTenthsMm2))} m²`;
}

/** `2750,0 × 1850,0 mm` — a medida do retângulo lida de uma vez, com uma unidade só. */
export function formatDimensions(lengthTenthsMm: number, widthTenthsMm: number): string {
  return `${formatMillimetersValue(lengthTenthsMm)} × ${formatMillimetersValue(widthTenthsMm)} mm`;
}

/**
 * Aproveitamento e sobra, ex. `87%`. Sem casa decimal: a diferença entre 87,3%
 * e 87% não muda decisão nenhuma, e a casa a mais sugere uma precisão que o
 * arranjo — escolhido entre tentativas — não tem.
 */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** `1 peça` / `4 peças` — o número junto do substantivo na forma certa. */
export function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
