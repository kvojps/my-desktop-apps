import type { RectangleBatch } from './rectangle';

/**
 * Chapa: retângulo de matéria-prima **disponível** no projeto (CONTEXT.md).
 * Nunca o desenho do resultado — aquilo é uma chapa planejada.
 *
 * Não há campo que distinga retalho de chapa inteira: retalho é chapa como
 * qualquer outra, distinguida só pelo tamanho. É o que permite ao estoque do
 * projeto ser a mistura que ele é na parede da oficina.
 */
export interface Sheet extends RectangleBatch {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

/** A chapa é o retângulo com quantidade, e nada além dele. */
export type SheetInput = RectangleBatch;
