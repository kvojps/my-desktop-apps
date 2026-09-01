/**
 * O nome que o diálogo de salvar sugere para o backup.
 *
 * Diferente do nome do plano exportado, este não carrega projeto nenhum: o
 * arquivo é do app inteiro. O que distingue dois backups é a data, e é ela que
 * o usuário procura ao restaurar — "o de antes de eu apagar aquilo".
 *
 * Módulo puro, sem import de runtime, para ficar ao alcance da suíte.
 */

const PREFIX = 'meu-movel-planejado-backup';

export function backupFileName(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  // O dia **local**, pela mesma razão do nome do plano: exportar às 21h no
  // Brasil já é o dia seguinte em UTC, e o usuário procura pelo dia em que
  // estava mexendo no app. O zero à esquerda faz os nomes ordenarem sozinhos na
  // pasta, que é como uma sequência de backups é lida.
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${PREFIX}-${day}.json`;
}
