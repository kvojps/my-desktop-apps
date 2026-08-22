import type { RectangleBatch } from './rectangle';

/**
 * Peça: retângulo que precisa ser cortado (CONTEXT.md). É **demanda**, não
 * resultado — a peça já cortada não existe no modelo, e onde ela caiu na chapa
 * é uma colocação do plano, outra coisa.
 *
 * A peça não declara material: material é rótulo do projeto, e dois materiais
 * são dois projetos.
 */
export interface Piece extends RectangleBatch {
  id: string;
  projectId: string;
  /**
   * Opcional na tela e sempre presente aqui, como string vazia: `label` nulo
   * obrigaria toda leitura a decidir de novo o que fazer com a ausência, e a
   * resposta é sempre a mesma — a lista mostra a medida no lugar.
   */
  label: string;
  createdAt: string;
  updatedAt: string;
}

/** Rótulo é para reconhecer o pedaço depois de cortado, não para descrevê-lo. */
export const MAX_PIECE_LABEL_LENGTH = 80;

export interface PieceInput extends RectangleBatch {
  label: string;
}
