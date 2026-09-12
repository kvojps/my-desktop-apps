import type { Month } from '@shared/types/month';
import type { DashboardQuery } from '@/contexts/pendingReturn';
import { isInRange, totalPagesFor } from './monthRows';

/**
 * A consulta guardada, reaplicada aos meses que existem **agora**.
 *
 * A sessão lembra a pergunta, não a resposta: entre sair para um Mês e voltar,
 * uma exclusão ou uma importação pode ter levado embora metade da tabela. O
 * intervalo e a ordenação voltam como estavam — foi o usuário que os escolheu,
 * e um recorte que ficou sem meses é ausência a explicar, não motivo para
 * trocar a pergunta dele. A página é a parte que não sobrevive: pedir a
 * página 3 de uma tabela que agora tem uma deixaria a tela vazia sem estar
 * vazia, então ela é confinada ao que ainda existe.
 *
 * Devolve `null` quando não há retorno pendente — a tela então deriva o padrão.
 */
export function restoreDashboardQuery(
  saved: DashboardQuery | null,
  months: Month[],
): DashboardQuery | null {
  if (!saved) return null;
  // Sem mês nenhum não há o que confinar: lista vazia aqui é "os meses ainda
  // não chegaram", e a tela sem mês de verdade mostra a orientação inicial.
  if (months.length === 0) return saved;

  const inRange = months.filter((month) => isInRange(month, saved.from, saved.to));
  const page = Math.min(Math.max(1, saved.page), totalPagesFor(inRange.length));

  return { ...saved, page };
}
