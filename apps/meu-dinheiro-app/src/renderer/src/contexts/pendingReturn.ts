import type { OriginView } from '@/routes';

/** O recorte da Visão Geral que a sessão lembra. */
export interface DashboardQuery {
  from: string;
  to: string;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  page: number;
}

/**
 * O mesmo para o Histórico: o ano consultado, a aba em que ele foi lido e se
 * **essa aba** estava em gráfico ou em tabela. A escolha de leitura é de cada
 * aba, e o que o retorno precisa restaurar é a da aba que fica visível.
 */
export interface HistoryQuery {
  year: number;
  tab: string;
  mode: string;
}

/** A consulta que cada origem guarda. O `view` escolhe o formato. */
export interface OriginQueries {
  dashboard: DashboardQuery;
  history: HistoryQuery;
}

/**
 * O retorno armado ao abrir um Mês: de que tela ele veio, o que ela estava
 * perguntando e onde ela estava rolada.
 */
export interface PendingReturn {
  view: OriginView;
  query: OriginQueries[OriginView] | null;
  scroll: number;
}

/**
 * O retorno **só responde à tela que o armou**. Sem essa guarda, um retorno
 * armado pelo Histórico seria consumido pela Visão Geral, que restauraria uma
 * consulta que não é dela.
 */
export function returnFor(pending: PendingReturn | null, view: OriginView): PendingReturn | null {
  return pending && pending.view === view ? pending : null;
}
