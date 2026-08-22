/**
 * Área na unidade do domínio: décimo de milímetro **ao quadrado**, sempre
 * inteiro, porque as duas medidas que a produzem já são inteiras nessa escala.
 *
 * Metro quadrado existe só na tela. É a unidade em que o marceneiro compara o
 * serviço com o estoque — e, mais adiante, em que o déficit é reportado.
 */
import type { RectangleBatch } from '@shared/types/rectangle';

/** Um décimo de milímetro é 1e-4 m, então um metro quadrado são 1e8 décimos². */
const TENTHS_MM2_PER_SQUARE_METER = 100_000_000;

/** Área do lote inteiro — a medida do retângulo repetida pela quantidade. */
function batchAreaTenthsMm2(batch: RectangleBatch): number {
  return batch.lengthTenthsMm * batch.widthTenthsMm * batch.quantity;
}

/**
 * Área somada dos lotes, sem descontar nada: nem o kerf que cada peça consome
 * ao redor, nem o refile de cada chapa. Os dois são geometria de plano, e esta
 * conta é a que o usuário faz de olho antes de existir plano — descontar de um
 * lado só daria uma comparação torta.
 */
export function totalAreaTenthsMm2(batches: readonly RectangleBatch[]): number {
  return batches.reduce((total, batch) => total + batchAreaTenthsMm2(batch), 0);
}

/** A unidade do domínio para o metro quadrado da tela. */
export function tenthsMm2ToSquareMeters(areaTenthsMm2: number): number {
  return areaTenthsMm2 / TENTHS_MM2_PER_SQUARE_METER;
}
