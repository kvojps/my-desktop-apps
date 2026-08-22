export const ROUTES = {
  PROJECTS: '/projects',
  /** A tela onde o serviço é descrito: peças, chapas e parâmetros de corte. */
  PROJECT: '/projects/:projectId',
} as const;

/** O caminho concreto da tela de um projeto, para navegar sem montar string. */
export function projectPath(projectId: string): string {
  return `${ROUTES.PROJECTS}/${projectId}`;
}
