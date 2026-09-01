/**
 * Peça no vocabulário do processo main: retângulo que precisa ser cortado
 * (`CONTEXT.md`). É **demanda**, não resultado — onde ela caiu na chapa é uma
 * colocação do plano, outra coisa.
 *
 * `PieceEntity` é estruturalmente idêntica a `Piece` de `@shared/types/piece`;
 * o porquê do sufixo `Entity` está em `domain/project.ts`.
 */
export type PieceEntity = {
  id: string;
  projectId: string;
  /** Sempre presente aqui, como string vazia quando a tela não preencheu. */
  label: string;
  lengthTenthsMm: number;
  widthTenthsMm: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};
