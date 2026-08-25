import type Database from 'better-sqlite3';
import { type IpcMainInvokeEvent, dialog } from 'electron';
import fs from 'node:fs/promises';
import type { ExportResult, ImportResult } from '@shared/ipc/api';
import { exportBackup, importBackup } from '../db/backupRepository';
import { AppError } from '../errors/AppError';
import { errorReason } from '../errors/errorReason';
import { windowFor } from '../ipc/windowFor';
import { backupFileName } from './backupFileName';
import { BACKUP_REFUSAL_MESSAGES, readBackupFile } from './readBackupFile';

/**
 * O backup como arquivo: escolher onde salvar, gravar, escolher o que abrir,
 * conferir e restaurar.
 *
 * Este módulo é a fronteira com o sistema — diálogo e disco, e só isso. O
 * formato do arquivo mora no schema, a conferência em `readBackupFile` e a
 * gravação no banco, no repositório.
 *
 * O que sobra aqui, e não cabe em nenhum dos três, é a tradução de cada desfecho
 * para o que a tela entende: a desistência do usuário volta como **resultado**,
 * a falha de leitura sobe classificada como falha de importação, e cada recusa
 * de conferência sobe com a mensagem própria dela.
 */

const FILTER = { name: 'Backup do Meu Móvel Planejado', extensions: ['json'] };

export async function exportBackupFile(
  event: IpcMainInvokeEvent,
  db: Database.Database,
): Promise<ExportResult> {
  const result = await dialog.showSaveDialog(windowFor(event), {
    title: 'Exportar dados',
    defaultPath: backupFileName(new Date()),
    filters: [FILTER],
  });

  // Cancelar sobe como resultado, e não como exceção: foi o usuário que
  // respondeu, e o app não tem o que lhe informar de volta.
  if (result.canceled || !result.filePath) return { success: false, error: 'canceled' };

  const data = exportBackup(db);

  try {
    // Indentado: o arquivo é do usuário, fica no pen drive dele e é a última
    // cópia que resta se o banco se perder. Legível é o que permite conferir, e
    // no limite recuperar à mão, o que o app não conseguir mais importar.
    await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Código próprio: sem ele, um `EACCES` daqui seria classificado como
    // problema da pasta de dados do app, e a tela mandaria o usuário conferir
    // permissões de uma pasta que não é a que ele acabou de escolher.
    throw new AppError(500, `Falha ao gravar o arquivo: ${errorReason(err)}`, 'export-failed');
  }

  return { success: true, filePath: result.filePath };
}

export async function importBackupFile(
  event: IpcMainInvokeEvent,
  db: Database.Database,
): Promise<ImportResult> {
  const result = await dialog.showOpenDialog(windowFor(event), {
    title: 'Importar dados',
    filters: [FILTER],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0)
    return { success: false, error: 'canceled' };

  let raw: string;
  try {
    raw = await fs.readFile(result.filePaths[0], 'utf-8');
  } catch (err) {
    throw new AppError(500, `Falha ao ler o arquivo: ${errorReason(err)}`, 'import-failed');
  }

  // `400` de propósito: a recusa vira `invalid-input`, e é o único código cuja
  // mensagem o renderer exibe literalmente. É assim que a mensagem própria de
  // cada motivo chega inteira à tela, em vez de virar "falha ao ler os dados".
  const conferred = readBackupFile(raw);
  if (!conferred.ok) throw new AppError(400, BACKUP_REFUSAL_MESSAGES[conferred.refusal]);

  try {
    importBackup(db, conferred.file);
  } catch (err) {
    // O que o banco recusa aqui é o arquivo, não o app: chave estrangeira órfã,
    // coluna obrigatória vazia. A gravação é uma transação só, então a recusa
    // pode prometer que nada foi alterado — e é essa promessa que torna a ação
    // irreversível oferecível.
    if (err instanceof AppError) throw err;
    throw new AppError(400, `O backup está inconsistente e não foi importado: ${errorReason(err)}`);
  }

  return { success: true };
}
