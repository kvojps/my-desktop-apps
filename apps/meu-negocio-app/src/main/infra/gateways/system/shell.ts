import { app, shell } from 'electron';

/**
 * O que o app pede ao sistema operacional para abrir. Hoje só a pasta de
 * dados, pelo botão "Abrir pasta de dados" do backup.
 */
export interface ShellGateway {
  /**
   * A pasta `userData`. O caminho é do Electron, e é por isso que ele mora
   * aqui: perguntá-lo é sair do processo tanto quanto abri-lo.
   */
  openDataFolder(): Promise<void>;
}

export const shellGateway: ShellGateway = {
  async openDataFolder(): Promise<void> {
    await shell.openPath(app.getPath('userData'));
  },
};
