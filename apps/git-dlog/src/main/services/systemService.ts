import type { DialogParentWindow, DialogsGateway } from '../infra/gateways/system/dialogs';
import type { ShellGateway } from '../infra/gateways/system/shell';

/**
 * O que o app pede ao sistema operacional fora do domínio: escolher um
 * diretório, abrir uma URL, abrir a pasta de dados.
 *
 * Os três são repasse de uma linha, e é de propósito. Nenhuma camada é pulável
 * (ADR-0002): se o controller chamasse o gateway direto quando "não tem regra",
 * a árvore deixaria de responder onde a regra mora — a resposta viraria
 * "depende", que é o problema que o desenho fecha. O dia em que abrir um
 * diretório passar a ter condição, ela já tem onde nascer.
 *
 * Os gateways chegam por parâmetro pelo motivo de sempre nos de `system/`: os
 * dois importam Electron, e o service que os importasse o conheceria por
 * transitividade.
 */
export function makeSystemService(shell: ShellGateway, dialogs: DialogsGateway) {
  return {
    /**
     * A janela vem de fora porque só o controller a conhece: ela é resolvida a
     * partir do `event.sender`, que é fronteira de IPC e não atravessa para cá.
     * Daqui ela é um valor opaco, repassado ao gateway sem ser lido.
     */
    selectDirectory(parent: DialogParentWindow): Promise<string | null> {
      return dialogs.selectDirectory(parent);
    },

    openExternal(url: string): Promise<void> {
      return shell.openExternal(url);
    },

    openDataFolder(): Promise<void> {
      return shell.openDataFolder();
    },
  };
}

export type SystemService = ReturnType<typeof makeSystemService>;
