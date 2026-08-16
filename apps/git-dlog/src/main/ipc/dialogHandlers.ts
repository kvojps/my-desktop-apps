import { BrowserWindow, type IpcMainInvokeEvent, dialog, ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';

function windowFor(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    throw new Error('No BrowserWindow associated with this IPC event');
  }
  return window;
}

export function registerDialogHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.dialogSelectDirectory, async (event): Promise<string | null> => {
    const result = await dialog.showOpenDialog(windowFor(event), {
      title: 'Selecionar diretório',
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });
}
