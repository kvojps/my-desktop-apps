import { describe, expect, it } from 'vitest';
import { backupFileName } from './backupFileName';

/**
 * O nome que o diálogo de salvar sugere para o backup. Diferente do nome do
 * plano exportado, este não carrega projeto nenhum: o arquivo é do app inteiro,
 * e o que distingue dois backups é a data.
 */
describe('backupFileName', () => {
  it('nomeia o app e o dia da exportação', () => {
    expect(backupFileName(new Date(2026, 7, 24, 15, 0))).toBe(
      'meu-movel-planejado-backup-2026-08-24.json',
    );
  });

  it('carimba o dia local, e não o dia UTC', () => {
    // Exportar às 21h no Brasil já é o dia seguinte em UTC. Quem procura o
    // backup procura pelo dia em que o gerou.
    expect(backupFileName(new Date(2026, 7, 24, 21, 30))).toContain('2026-08-24');
  });

  it('preenche mês e dia com zero à esquerda, para os nomes ordenarem sozinhos', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('meu-movel-planejado-backup-2026-01-05.json');
  });
});
