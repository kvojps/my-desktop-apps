import { BrowserWindow, type IpcMainInvokeEvent } from 'electron';

/**
 * A janela de onde a chamada veio.
 *
 * Existe para que o diálogo do sistema seja **modal da janela**, e não solto na
 * área de trabalho: um diálogo de salvar que perde o foco atrás do app é um
 * diálogo que o usuário procura em vez de responder.
 */
export function windowFor(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    throw new Error('No BrowserWindow associated with this IPC event');
  }
  return window;
}
