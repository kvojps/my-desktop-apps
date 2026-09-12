/**
 * As páginas visíveis numa barra de paginação: a primeira, a última, a atual e
 * uma vizinha de cada lado, com `gap` no que ficou de fora.
 *
 * Doze meses por página levam uma base de alguns anos a mais de vinte páginas,
 * e uma fileira com todos os números ocuparia a largura inteira da tabela. A
 * janela é sempre do mesmo tamanho, então o rodapé não muda de largura ao
 * navegar — que é o mesmo motivo de a coluna "Pagas" reservar a fração.
 */
export function pageWindow(currentPage: number, totalPages: number): (number | 'gap')[] {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const visible = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return visible.flatMap((page, index) =>
    index > 0 && page - visible[index - 1] > 1 ? ['gap' as const, page] : [page],
  );
}
