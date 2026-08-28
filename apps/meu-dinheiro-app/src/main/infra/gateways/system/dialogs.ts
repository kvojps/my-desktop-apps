import { type BrowserWindow, dialog } from 'electron';

/**
 * A janela que o diálogo nativo trava enquanto está aberto.
 *
 * O apelido existe para o `backupService` poder nomear o parâmetro sem falar
 * Electron: quem resolve a janela é o controller, a partir do `event.sender`
 * (fronteira de IPC), e daí em diante ela é um valor opaco de passagem. Sem o
 * apelido, escrever a assinatura do service exigiria importar `BrowserWindow` —
 * o que os gateways de `system/` existem para evitar.
 */
export type DialogParentWindow = BrowserWindow;

/** Os diálogos nativos do sistema, hoje só usados pelo backup. */
export interface DialogsGateway {
  /** `null` quando o usuário cancela sem escolher onde salvar. */
  showSaveDialog(parent: DialogParentWindow, defaultPath: string): Promise<string | null>;
  /** `null` quando o usuário cancela sem escolher um arquivo. */
  showOpenDialog(parent: DialogParentWindow): Promise<string | null>;
}

export const dialogs: DialogsGateway = {
  async showSaveDialog(parent: DialogParentWindow, defaultPath: string): Promise<string | null> {
    const result = await dialog.showSaveDialog(parent, {
      title: 'Exportar dados',
      defaultPath,
      filters: [{ name: 'ZIP', extensions: ['zip'] }],
    });

    if (result.canceled || !result.filePath) return null;
    return result.filePath;
  },

  async showOpenDialog(parent: DialogParentWindow): Promise<string | null> {
    const result = await dialog.showOpenDialog(parent, {
      title: 'Importar dados',
      filters: [{ name: 'ZIP', extensions: ['zip'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  },
};
