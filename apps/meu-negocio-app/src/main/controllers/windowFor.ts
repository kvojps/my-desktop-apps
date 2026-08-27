import { BrowserWindow, type IpcMainInvokeEvent } from 'electron';

/**
 * A janela de onde a chamada veio.
 *
 * Existe para que o diálogo do sistema seja **modal da janela**, e não solto na
 * área de trabalho: um diálogo que perde o foco atrás do app é um diálogo que o
 * usuário procura em vez de responder.
 *
 * Fica em `controllers/` porque `IpcMainInvokeEvent` é a borda do IPC e não
 * atravessa para o service — o que desce para lá é a `BrowserWindow` já
 * resolvida. Hoje só o `backupController` a usa; é arquivo próprio, e não função
 * privada dele, pelo mesmo precedente do `git-dlog` (README §2.2).
 */
export function windowFor(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    throw new Error('No BrowserWindow associated with this IPC event');
  }
  return window;
}
