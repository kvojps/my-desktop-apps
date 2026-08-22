import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';

/**
 * Avisa o renderer de que o banco mudou. É um evento sem payload: quem escuta
 * recarrega o que tem, e o custo de recarregar demais é um punhado de queries
 * em SQLite local. Payload por domínio seria uma otimização que reintroduz a
 * chance de errar o mapeamento — exatamente o bug que este mecanismo fecha.
 */
export function notifyDataChanged(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC_CHANNELS.dataChanged);
  }
}
