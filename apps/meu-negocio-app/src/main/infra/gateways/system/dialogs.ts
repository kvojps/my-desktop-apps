import { type BrowserWindow, dialog } from 'electron';

/**
 * A janela que o diálogo nativo trava enquanto está aberto.
 *
 * O apelido existe para o service poder nomear o parâmetro sem falar Electron:
 * quem resolve a janela é o controller, porque quem a conhece é o
 * `event.sender`, e daí em diante ela é só um valor opaco de passagem. Sem o
 * apelido, o único jeito de escrever a assinatura do service seria importar
 * `BrowserWindow` — que é o que os gateways de `system/` existem para evitar.
 */
export type DialogParentWindow = BrowserWindow;

/**
 * Os diálogos nativos do sistema, hoje só usados pelo backup.
 */
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
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (result.canceled || !result.filePath) return null;
    return result.filePath;
  },

  async showOpenDialog(parent: DialogParentWindow): Promise<string | null> {
    const result = await dialog.showOpenDialog(parent, {
      title: 'Importar dados',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  },
};
