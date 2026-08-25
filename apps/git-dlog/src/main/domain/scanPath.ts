/**
 * Um diretório que o usuário cadastrou para ser varrido em busca de
 * repositórios git.
 *
 * É estruturalmente idêntica ao `ScanPath` de `@shared/types/scanPath`, e o
 * sufixo `Entity` existe por causa disso: as duas aparecem no mesmo arquivo no
 * mapper do controller, e sem nomes diferentes o TypeScript não pegaria a
 * troca de uma pela outra. São peças diferentes — esta é o vocabulário do
 * processo principal, aquela é o contrato que atravessa o IPC — e nada garante
 * que sigam iguais.
 */
export type ScanPathEntity = {
  id: string;
  path: string;
  createdAt: string;
  updatedAt: string;
};
