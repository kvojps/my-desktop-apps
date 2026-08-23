/**
 * A régua da **rejeição**: esta peça cabe em alguma chapa do projeto?
 *
 * Vive à parte do empacotador porque duas telas dependem dela e nenhuma delas
 * gera plano. O cadastro de peça a consulta para barrar na hora a peça grande
 * demais — que não é falta de estoque, e recomendar a compra de mais chapas
 * mandaria o marceneiro gastar sem resolver. O plano a consulta de novo, porque
 * a chapa que comportava a peça pode ter sido excluída depois do cadastro.
 *
 * Uma régua só, e não duas concordando por coincidência: o dia em que a
 * aritmética do kerf mudar, ela muda aqui e as duas telas seguem juntas.
 */
// Caminho relativo, e não `@shared/`: o alias é do `tsconfig` de cada app, e a
// suíte da raiz não o resolve.
import type { Rectangle } from '../types/rectangle';

/** A geometria do corte, que é tudo de que a régua depende do projeto. */
export interface CuttingGeometry {
  kerfTenthsMm: number;
  trimTenthsMm: number;
}

/**
 * A mensagem da peça barrada. Mora junto da regra, e não na tela, para que ela
 * e a régua mudem no mesmo lugar — e porque quem a lê no cadastro e quem a lê
 * voltando do IPC precisam ler a mesma frase.
 *
 * Ela diz o que **não** é (falta de estoque) antes de dizer o que fazer: sem
 * isso a leitura natural é "faltou chapa", que é justamente a confusão que
 * separar rejeição de não alocação existe para desfazer.
 */
export const PIECE_DOES_NOT_FIT_MESSAGE =
  'Esta peça não cabe em nenhuma chapa do projeto, nem girada. Não é falta de estoque: comprar mais chapas do mesmo tamanho não resolveria. Reveja a medida da peça, o refile do projeto, ou cadastre uma chapa que a comporte.';

/**
 * A **área útil**: a chapa menos o refile dos dois lados. É o material de que o
 * plano dispõe, e a base de que o aproveitamento é fração (`CONTEXT.md`).
 */
export function usableSize(sheet: Rectangle, trimTenthsMm: number): Rectangle {
  return {
    lengthTenthsMm: Math.max(0, sheet.lengthTenthsMm - 2 * trimTenthsMm),
    widthTenthsMm: Math.max(0, sheet.widthTenthsMm - 2 * trimTenthsMm),
  };
}

/**
 * O retângulo em que as peças de fato se acomodam: a área útil diminuída de um
 * kerf. Não é área útil, e o glossário mantém os dois separados — este é
 * artifício de cálculo (ADR-0001).
 *
 * O kerf sai daqui e entra em cada peça, e é esse deslocamento único que abre
 * um kerf de folga em toda fronteira, contra a vizinha e contra a borda, sem
 * tratar a borda como caso especial.
 */
export function packableSize(sheet: Rectangle, geometry: CuttingGeometry): Rectangle {
  const usable = usableSize(sheet, geometry.trimTenthsMm);
  return {
    lengthTenthsMm: Math.max(0, usable.lengthTenthsMm - geometry.kerfTenthsMm),
    widthTenthsMm: Math.max(0, usable.widthTenthsMm - geometry.kerfTenthsMm),
  };
}

/**
 * A peça, já acrescida do kerf que ela consome ao redor, dentro do retângulo de
 * empacotamento — em pé ou girada, que é livre neste domínio.
 */
export function fitsPackable(piece: Rectangle, packable: Rectangle, kerfTenthsMm: number): boolean {
  const length = piece.lengthTenthsMm + kerfTenthsMm;
  const width = piece.widthTenthsMm + kerfTenthsMm;
  return (
    (length <= packable.lengthTenthsMm && width <= packable.widthTenthsMm) ||
    (width <= packable.lengthTenthsMm && length <= packable.widthTenthsMm)
  );
}

/**
 * Cabe em alguma chapa do projeto? Basta uma — o estoque é uma mistura de
 * retalho e chapa inteira, e é a maior delas que decide.
 *
 * **Projeto sem chapa nenhuma aceita qualquer peça.** Não há com o que comparar
 * e comprar resolve, que é a definição de peça não alocada; rejeitá-la aqui
 * barraria o cadastro de todo projeto que ainda não descreveu o estoque.
 */
export function fitsAnySheet(
  piece: Rectangle,
  sheets: readonly Rectangle[],
  geometry: CuttingGeometry,
): boolean {
  if (sheets.length === 0) return true;
  return sheets.some((sheet) =>
    fitsPackable(piece, packableSize(sheet, geometry), geometry.kerfTenthsMm),
  );
}
