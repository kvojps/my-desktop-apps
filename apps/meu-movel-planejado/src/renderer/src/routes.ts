export const ROUTES = {
  PROJECTS: '/projects',
  /** A tela onde o serviço é descrito: peças, chapas e parâmetros de corte. */
  PROJECT: '/projects/:projectId',
  /**
   * A prancheta. Tela à parte da de Projeto justamente para que o desenho
   * receba a viewport inteira — tela de leitura preenche a viewport, tela de
   * lista rola (design system, §4).
   */
  PLAN: '/projects/:projectId/plan',
  /** Backup, onde os dados moram em disco, versão do app e tema. */
  SETTINGS: '/settings',
} as const;

/** O caminho concreto da tela de um projeto, para navegar sem montar string. */
export function projectPath(projectId: string): string {
  return `${ROUTES.PROJECTS}/${projectId}`;
}

/** O caminho concreto da prancheta de um projeto. */
export function planPath(projectId: string): string {
  return `${projectPath(projectId)}/plan`;
}
