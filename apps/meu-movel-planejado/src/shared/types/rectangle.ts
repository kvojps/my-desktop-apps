/**
 * Peça e chapa são o mesmo retângulo com quantidade — uma é demanda, a outra é
 * disponibilidade —, e por isso os limites do que se pode digitar são os mesmos
 * para as duas. Eles moram aqui, e não em cada schema, porque a fronteira de
 * confiança (`main/schemas/`) e o formulário (`renderer/hooks/`) precisam
 * concordar: um limite mais largo no main deixa passar o que a tela recusa, e o
 * contrário mente sobre o que o app aceita.
 */

/** Zero não é medida: um retângulo de lado nulo não é peça nem chapa. */
export const MIN_MEASURE_TENTHS_MM = 1;

/**
 * 10 m. Não é limite de máquina — é o que impede um dígito a mais de virar uma
 * chapa de 275 m sem ninguém perceber. A maior chapa de MDF do mercado tem
 * 2,80 m.
 */
export const MAX_MEASURE_TENTHS_MM = 100_000;

/** Quantidade de um lote. Acima disso não é mais um serviço de marcenaria. */
export const MAX_QUANTITY = 999;

/**
 * O retângulo com quantidade que peça e chapa são, cada uma de um lado do
 * serviço: uma é demanda, a outra é disponibilidade. É o que basta para medir
 * área, e é por isso que a mesma soma serve às duas.
 */
export interface RectangleBatch {
  lengthTenthsMm: number;
  widthTenthsMm: number;
  quantity: number;
}
