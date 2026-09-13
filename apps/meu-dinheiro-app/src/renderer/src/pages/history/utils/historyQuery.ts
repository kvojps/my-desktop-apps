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

/**
 * O ano que a tela mostra: o escolhido enquanto ele tem mês, e o mais recente
 * quando não tem mais.
 *
 * Devolve `null` — e não um ano qualquer — quando **nenhum** ano tem mês. Sem
 * essa resposta o recorte caía num `?? 0` e a tela escrevia "Nenhum mês
 * cadastrado em 0", ou seja, culpava um ano inexistente por uma ausência que é
 * do banco inteiro. Um histórico sem competência nenhuma não tem ano a exibir,
 * e quem chama precisa poder dizer isso.
 *
 * `years` vem em ordem decrescente, como a tela os lista.
 */
export function selectHistoryYear(years: number[], chosen: number | null): number | null {
  if (chosen !== null && years.includes(chosen)) return chosen;
  return years[0] ?? null;
}
