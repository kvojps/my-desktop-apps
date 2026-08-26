import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { SettingsService } from '../services/settingsService';
import type { SystemService } from '../services/systemService';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { themeModeSchema } from './schemas/settings.schema';
import { externalUrlSchema } from './schemas/system.schema';
import { windowFor } from './windowFor';

/**
 * O que o app pede ao sistema operacional, mais a preferência de tema.
 *
 * O tema não tem controller próprio: é o único canal de `settings` e o que ele
 * grava só se enxerga na moldura nativa da janela, que é o mesmo mundo externo
 * dos outros três. Um `settingsController.ts` com um handler dentro contaria
 * uma história que o app não tem — quando `settings` ganhar um segundo canal,
 * ele nasce e este perde o dele.
 *
 * Nenhum dos quatro devolve entidade, então nenhum tem mapper de saída: os
 * três de sistema respondem `string | null` ou nada, e o tema é `void`.
 */
export function registerSystemController(system: SystemService, settings: SettingsService): void {
  handle(IPC_CHANNELS.dialogSelectDirectory, (event): Promise<string | null> =>
    system.selectDirectory(windowFor(event)),
  );

  handle(IPC_CHANNELS.shellOpenExternal, async (_event, data: unknown): Promise<void> => {
    await system.openExternal(parseOrThrow(externalUrlSchema, data));
  });

  handle(IPC_CHANNELS.dataOpenFolder, (): Promise<void> => system.openDataFolder());

  // `ThemeMode` e `ThemeModeEntity` são a mesma união de literais, e por isso o
  // valor validado entra no service sem mapper: uma variante nova de um lado
  // quebra o `tsc` aqui na chamada, que é a decisão que um mapper forçaria.
  // O critério está escrito por extenso em `responses/pullRequest.response.ts`.
  handle(IPC_CHANNELS.settingsSaveThemeMode, (_event, data: unknown): void => {
    settings.saveThemeMode(parseOrThrow(themeModeSchema, data));
  });
}
