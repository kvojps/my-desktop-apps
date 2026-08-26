import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { PrIntegrationStatus } from '@shared/types/pullRequest';
import type { PrsService } from '../services/prsService';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { prIntegrationStatusToResponse } from './responses/pullRequest.response';
import { githubTokenSchema } from './schemas/prs.schema';

/**
 * Os canais da integração com os provedores de pull request. Os PRs em si nunca
 * saem por aqui: eles atravessam dentro de `RepoScanResult`, pelo controller de
 * repos. O que este responde é o estado da integração e a guarda do token.
 */
export function registerPrsController(prs: PrsService): void {
  handle(IPC_CHANNELS.prsGetStatus, async (): Promise<PrIntegrationStatus> =>
    prIntegrationStatusToResponse(await prs.getIntegrationStatus()),
  );

  // O login devolvido é `string`, não entidade: não há nó de domínio para
  // mapear, e o valor nasce no gateway que verifica o token.
  handle(IPC_CHANNELS.prsSaveToken, (_event, data: unknown): Promise<string> =>
    prs.saveGithubToken(parseOrThrow(githubTokenSchema, data)),
  );

  handle(IPC_CHANNELS.prsDeleteToken, (): void => {
    prs.deleteGithubToken();
  });

  handle(IPC_CHANNELS.prsRedetect, async (): Promise<PrIntegrationStatus> =>
    prIntegrationStatusToResponse(await prs.redetectProviders()),
  );
}
