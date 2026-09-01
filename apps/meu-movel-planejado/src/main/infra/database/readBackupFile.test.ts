import { describe, expect, it } from 'vitest';
import { BACKUP_APP, BACKUP_VERSION } from '../../controllers/schemas/backup.schema';
import { BACKUP_REFUSAL_MESSAGES, readBackupFile } from './readBackupFile';
import { BACKUP_TABLES } from './repositories/backupRepository';

/**
 * A conferência do arquivo escolhido para importar.
 *
 * O que se testa aqui não é "aceita ou recusa": é **qual recusa**. A importação
 * apaga tudo que o usuário tem, e cada motivo manda a um lugar diferente —
 * outro arquivo, outra versão do app, outra cópia do mesmo arquivo. Uma recusa
 * genérica faria o usuário adivinhar qual dos três é o caso dele.
 */

function validFile(overrides: Record<string, unknown> = {}) {
  const tables = Object.fromEntries(BACKUP_TABLES.map((table) => [table, []]));
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exported_at: '2026-08-24T18:00:00.000Z',
    ...tables,
    ...overrides,
  };
}

const raw = (value: unknown) => JSON.stringify(value);

describe('readBackupFile', () => {
  it('aceita um arquivo gerado pelo próprio app', () => {
    const result = readBackupFile(raw(validFile()));

    expect(result.ok).toBe(true);
  });

  it('devolve o arquivo já conferido, para a gravação não conferir de novo', () => {
    const result = readBackupFile(raw(validFile({ projects: [{ id: 'p1', name: 'Cozinha' }] })));

    expect(result.ok && result.file.projects[0].id).toBe('p1');
  });

  it('recusa o que nem JSON é', () => {
    // Arquivo trocado por um binário, ou um `.json` que não é JSON.
    expect(readBackupFile('não é json {')).toEqual({ ok: false, refusal: 'not-json' });
  });

  it('recusa o backup de outro app do monorepo pela identidade', () => {
    // O do Meu Dinheiro: mesma versão, mesmo `exported_at`, outras tabelas. É o
    // arquivo realmente perigoso, porque é o parecido.
    const otherApp = { version: 1, exported_at: '2026-08-24T18:00:00.000Z', months: [] };

    expect(readBackupFile(raw(otherApp))).toEqual({ ok: false, refusal: 'foreign-app' });
  });

  it('recusa por versão o backup de uma versão futura', () => {
    expect(readBackupFile(raw(validFile({ version: 99 })))).toEqual({
      ok: false,
      refusal: 'unknown-version',
    });
  });

  it('recusa como danificado o backup da versão certa a que falta uma tabela', () => {
    // A distinção que importa: identidade e versão batem, então o arquivo é
    // deste app e deveria ser legível — o que há é dano, e mandar "atualize o
    // app" faria o usuário perseguir o problema errado.
    const truncated = validFile();
    delete (truncated as Record<string, unknown>).plans;

    expect(readBackupFile(raw(truncated))).toEqual({ ok: false, refusal: 'damaged' });
  });

  it('pergunta pela identidade antes da versão', () => {
    // Arquivo de outro app *e* de outra versão: o que o usuário precisa ouvir é
    // que o arquivo é de outro app. A versão dele não diz nada sobre este.
    const foreign = { app: 'meu-negocio', version: 99, exported_at: 'x' };

    expect(readBackupFile(raw(foreign))).toEqual({ ok: false, refusal: 'foreign-app' });
  });

  it('recusa o que nem objeto é', () => {
    for (const value of [null, 'texto', 42, []]) {
      expect(readBackupFile(raw(value)), JSON.stringify(value)).toEqual({
        ok: false,
        refusal: 'foreign-app',
      });
    }
  });

  it('tem uma mensagem própria e distinta para cada recusa', () => {
    // É o que o ticket cobra: recusa com mensagem própria, distinta de falha de
    // leitura. Duas iguais mandariam o usuário ao lugar errado.
    const messages = Object.values(BACKUP_REFUSAL_MESSAGES);

    expect(new Set(messages).size).toBe(messages.length);
    for (const message of messages) expect(message.length).toBeGreaterThan(0);
  });
});
