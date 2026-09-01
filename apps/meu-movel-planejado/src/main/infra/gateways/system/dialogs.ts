import { type BrowserWindow, dialog } from 'electron';

/**
 * A janela que o diálogo nativo trava enquanto está aberto.
 *
 * O apelido existe para o service poder nomear o parâmetro sem falar Electron:
 * quem resolve a janela é o controller, porque quem a conhece é o `event.sender`,
 * e daí em diante ela é só um valor opaco de passagem. Sem o apelido, o único
 * jeito de escrever a assinatura do service seria importar `BrowserWindow` — que
 * é o que os gateways de `system/` existem para evitar.
 */
export type DialogParentWindow = BrowserWindow;

/** Um tipo de arquivo oferecido no diálogo: o rótulo visível e as extensões. */
export interface DialogFileType {
  name: string;
  extensions: string[];
}

export interface SaveDialogOptions {
  title: string;
  defaultPath: string;
  fileTypes: DialogFileType[];
}

export interface OpenDialogOptions {
  title: string;
  fileTypes: DialogFileType[];
}

/**
 * Os diálogos nativos de salvar e abrir. O backup os usa para o arquivo `.json`;
 * a exportação do plano, para o `.png` e o `.pdf`. O `title`, o nome sugerido e
 * os tipos de arquivo vêm de quem chama — o que fica aqui é a tradução para o
 * `dialog` do Electron e o "cancelou" virando `null`.
 */
export interface DialogsGateway {
  /** `null` quando o usuário cancela sem escolher onde salvar. */
  showSaveDialog(parent: DialogParentWindow, options: SaveDialogOptions): Promise<string | null>;
  /** `null` quando o usuário cancela sem escolher um arquivo. */
  showOpenDialog(parent: DialogParentWindow, options: OpenDialogOptions): Promise<string | null>;
}

export const dialogs: DialogsGateway = {
  async showSaveDialog(parent, options): Promise<string | null> {
    const result = await dialog.showSaveDialog(parent, {
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.fileTypes,
    });

    if (result.canceled || !result.filePath) return null;
    return result.filePath;
  },

  async showOpenDialog(parent, options): Promise<string | null> {
    const result = await dialog.showOpenDialog(parent, {
      title: options.title,
      filters: options.fileTypes,
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  },
};
