import { app, shell } from 'electron';
import { AppError } from '../../../utils/errors/AppError';

/**
 * O que o app pede ao sistema operacional para abrir. Hoje só a pasta de dados,
 * pelo botão "Abrir pasta de dados" da tela de Configurações.
 */
export interface ShellGateway {
  /**
   * A pasta `userData`. O caminho é do Electron, e é por isso que ele mora aqui:
   * perguntá-lo é sair do processo tanto quanto abri-lo.
   */
  openDataFolder(): Promise<void>;
}

export const shellGateway: ShellGateway = {
  async openDataFolder(): Promise<void> {
    const failure = await shell.openPath(app.getPath('userData'));
    if (failure) throw new AppError(500, failure);
  },
};
