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
 * Os diálogos nativos do sistema. `dialog` é mundo externo pelo mesmo motivo
 * que o disco e o cofre: quem o chama para de ser exercitável sem Electron.
 */
export interface DialogsGateway {
  /** `null` quando o usuário fecha sem escolher. */
  selectDirectory(parent: DialogParentWindow): Promise<string | null>;
}

export const dialogs: DialogsGateway = {
  async selectDirectory(parent: DialogParentWindow): Promise<string | null> {
    const result = await dialog.showOpenDialog(parent, {
      title: 'Selecionar diretório',
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  },
};
