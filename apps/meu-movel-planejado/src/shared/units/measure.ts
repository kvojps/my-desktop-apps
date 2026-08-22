/**
 * O décimo de milímetro é a unidade do domínio: toda medida trafega pelo IPC e
 * é persistida como inteiro nessa escala (2750 mm = 27500). Milímetro com uma
 * casa decimal existe só na digitação e na formatação de tela, e é aqui — na
 * fronteira — que a conversão acontece. Nunca no meio da lógica.
 *
 * A razão de a unidade ser inteira é o kerf fracionário: `0,3 mm` em ponto
 * flutuante transforma "cabe exatamente" em "não cabe por 0,0000001 mm", e o
 * empacotamento é feito de comparações desse tipo.
 */

/**
 * Medida digitada em milímetro (uma casa decimal) para a unidade do domínio.
 * Arredonda porque a multiplicação em ponto flutuante não devolve inteiro:
 * `0.3 * 10` é `2.9999999999999996`.
 */
export function millimetersToTenths(millimeters: number): number {
  return Math.round(millimeters * 10);
}

/** A unidade do domínio de volta para milímetro, para digitar e para exibir. */
export function tenthsToMillimeters(tenths: number): number {
  return tenths / 10;
}
