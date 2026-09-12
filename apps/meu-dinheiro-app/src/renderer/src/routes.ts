export const ROUTES = {
  DASHBOARD: '/dashboard',
  HISTORY: '/history',
  SETTINGS: '/settings',
  MONTH_DETAIL: '/months/:id',
} as const;

/** O prefixo das rotas de Mês, para montar uma e para reconhecer as outras. */
const MONTH_PREFIX = '/months/';

export function monthDetailPath(id: number | string): string {
  return `${MONTH_PREFIX}${id}`;
}

/**
 * As telas que abrem um Mês, e para as quais o retorno precisa voltar. O tipo
 * mora aqui porque origem é destino: quem a conhece é quem conhece as rotas.
 */
export type OriginView = 'dashboard' | 'history';

/**
 * Para onde o detalhe de Mês volta. Sem origem conhecida — uma rota de Mês
 * aberta direto, ou uma sessão que começou nela — o retorno é a Visão Geral,
 * que é a tela inicial do app e a única que existe sempre.
 */
export function originPath(origin: OriginView | null): string {
  return origin === 'history' ? ROUTES.HISTORY : ROUTES.DASHBOARD;
}

/**
 * Se chegar a `pathname` ainda faz parte da visita ao Mês aberto a partir de
 * `origin`.
 *
 * Andar de Mês em Mês faz; chegar à origem também, porque é ela quem vai
 * restaurar a consulta. Qualquer outro destino encerra a visita: pela lateral
 * se **chega** a uma tela, não se volta a ela, e um retorno que sobrevivesse a
 * isso restauraria mais tarde uma pergunta já abandonada.
 */
export function staysInMonthVisit(origin: OriginView, pathname: string): boolean {
  return pathname.startsWith(MONTH_PREFIX) || pathname === originPath(origin);
}
