import type { HistoryQuery } from '@/contexts/pendingReturn';

/**
 * A consulta guardada do Histórico, reaplicada aos anos que existem **agora**.
 *
 * Vale aqui o mesmo da Visão Geral: a sessão lembra a pergunta, não a resposta.
 * O ano é a parte que pode não sobreviver — excluir a última competência de
 * 2025 leva o ano inteiro embora —, e pedir um ano que não existe mais deixaria
 * a tela sem indicador nenhum sem dizer por quê. Nesse caso responde o ano mais
 * recente, que é o mesmo padrão de quem chega à tela. A aba e o modo
 * atravessam: os dois são escolha de leitura, não recorte de dado — nenhum
 * deles pode deixar de existir porque um mês foi excluído.
 *
 * `years` vem em ordem decrescente, como a tela os lista.
 * Devolve `null` quando não há retorno pendente — a tela então deriva o padrão.
 */
export function restoreHistoryQuery(
  saved: HistoryQuery | null,
  years: number[],
): HistoryQuery | null {
  if (!saved) return null;
  // Sem ano nenhum não há o que confinar: a lista vazia aqui é "os meses ainda
  // não chegaram", e não um histórico sem competência.
  if (years.length === 0) return saved;
  if (years.includes(saved.year)) return saved;

  return { ...saved, year: years[0] };
}
