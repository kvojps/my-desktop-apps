/**
 * Chapa no vocabulário do processo main: retângulo de matéria-prima
 * **disponível** no projeto (`CONTEXT.md`). Nunca o desenho do resultado —
 * aquilo é uma chapa planejada.
 *
 * `SheetEntity` é estruturalmente idêntica a `Sheet` de `@shared/types/sheet`;
 * o porquê do sufixo `Entity` está em `domain/project.ts`.
 */
export type SheetEntity = {
  id: string;
  projectId: string;
  lengthTenthsMm: number;
  widthTenthsMm: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};
