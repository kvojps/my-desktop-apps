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

/**
 * As seis seções de Configurações, na ordem em que a navegação interna as
 * apresenta — que é a ordem em que elas se usam: os quatro cadastros preparam
 * os meses, a criação de meses os consome e o backup guarda tudo.
 *
 * A seção mora na rota, e não só no estado da tela, porque é destino: a
 * orientação inicial da Visão Geral manda o usuário para a seção que resolve
 * cada passo dela, e um destino que não cabe num endereço não é um destino.
 */
export const SETTINGS_SECTIONS = [
  'bank-accounts',
  'categories',
  'default-expenses',
  'default-incomes',
  'months',
  'backup',
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

/** O nome do parâmetro na rota de Configurações, lido pela tela e escrito aqui. */
export const SETTINGS_SECTION_PARAM = 'section';

export function settingsPath(section?: SettingsSection): string {
  return section ? `${ROUTES.SETTINGS}?${SETTINGS_SECTION_PARAM}=${section}` : ROUTES.SETTINGS;
}

/**
 * A seção que a rota pede, ou a primeira. Endereço digitado à mão e endereço
 * de uma versão anterior do app chegam aqui: uma seção desconhecida abre a
 * tela na primeira, em vez de deixá-la sem conteúdo nenhum.
 */
export function resolveSettingsSection(param: string | null): SettingsSection {
  const known = SETTINGS_SECTIONS.find((section) => section === param);
  return known ?? SETTINGS_SECTIONS[0];
}
