/**
 * Estruturalmente idêntica a `Product` de `@shared/types/product`, e o sufixo
 * `Entity` existe por causa disso: as duas formas podem aparecer lado a lado
 * no mapper do controller (ticket 6), e sem nomes diferentes o TypeScript não
 * pegaria a troca de uma pela outra. São peças diferentes — esta é o
 * vocabulário do processo principal, aquela é o contrato que atravessa o
 * IPC — e nada garante que sigam iguais.
 */
export type ProductEntity = {
  id: string;
  name: string;
  description: string;
  category: string;
  supplier: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
};
