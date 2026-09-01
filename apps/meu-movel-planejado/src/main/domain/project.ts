/**
 * Projeto de corte no vocabulário do processo main: um serviço a planejar — um
 * material, as peças a cortar e as chapas de que se dispõe (`CONTEXT.md`).
 *
 * `ProjectEntity` é estruturalmente idêntica a `Project` de
 * `@shared/types/project`, e o sufixo `Entity` existe por causa disso: as duas
 * formas podem aparecer lado a lado no mapper do controller (ticket 06), e sem
 * nomes diferentes o `tsc` não pegaria a troca de uma pela outra. São peças
 * diferentes — esta é o que as camadas trocam entre si, aquela é o contrato que
 * atravessa o IPC — e nada garante que sigam iguais. É o mesmo motivo em todo
 * `domain/*.ts` deste app.
 */
export type ProjectEntity = {
  id: string;
  name: string;
  material: string;
  kerfTenthsMm: number;
  trimTenthsMm: number;
  createdAt: string;
  /**
   * Carimbo da última alteração do projeto, das suas peças ou das suas chapas.
   * É dele que a detecção de plano desatualizado depende.
   */
  updatedAt: string;
};
