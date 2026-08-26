import { app, shell } from 'electron';

/**
 * O que o app pede ao sistema operacional para abrir: uma URL no navegador
 * padrão e a própria pasta de dados no explorador de arquivos.
 *
 * Os dois viviam soltos no `registerIpc.ts`, chamando `shell` e `app` direto do
 * Electron dentro do handler. São mundo externo como qualquer outro, e o
 * caminho até eles é o mesmo de todo o resto: controller → service → gateway
 * (ADR-0002).
 */
export interface ShellGateway {
  /** Só http(s) chega aqui — o esquema é conferido pelo schema do controller. */
  openExternal(url: string): Promise<void>;
  /**
   * A pasta `userData`. O caminho é do Electron, e é por isso que ele mora
   * aqui: perguntá-lo é sair do processo tanto quanto abri-lo.
   */
  openDataFolder(): Promise<void>;
}

export const shellGateway: ShellGateway = {
  async openExternal(url: string): Promise<void> {
    await shell.openExternal(url);
  },

  async openDataFolder(): Promise<void> {
    await shell.openPath(app.getPath('userData'));
  },
};
