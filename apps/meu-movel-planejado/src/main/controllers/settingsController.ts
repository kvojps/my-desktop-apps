import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { SettingsService } from '../services/settingsService';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { themeModeSchema } from './schemas/theme.schema';

/**
 * A preferência de tema — o único ajuste do app, e um só canal: `theme:set`. O
 * modo inicial não passa por aqui (vai por argumento de linha de comando, antes
 * de o renderer existir — docs/design-system.md §5.1), então não há `theme:get`.
 *
 * O `settingsService` persiste e aplica. `ThemeMode` é união de literais, então
 * o valor validado entra sem mapper: uma variante nova quebra o `tsc` na
 * atribuição, que é o que um mapper existiria para forçar (README §2.5).
 */
export function registerSettingsController(settings: SettingsService): void {
  handle(IPC_CHANNELS.themeSet, (_event, mode: unknown): void => {
    settings.setThemeMode(parseOrThrow(themeModeSchema, mode));
  });
}
