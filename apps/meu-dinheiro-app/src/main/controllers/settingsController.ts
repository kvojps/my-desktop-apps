import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { ThemeMode } from '@shared/types/theme';
import type { SettingsService } from '../services/settingsService';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { themeModeSchema } from './schemas/theme.schema';

/**
 * A preferência de tema — o único ajuste do app. `theme:get` devolve o modo em
 * vigor nesta sessão (o que a moldura nativa já aplicou); `theme:set` persiste e
 * aplica. O `settingsService` faz as duas coisas.
 *
 * `ThemeMode` e `ThemeModeEntity` são a mesma união de literais, e por isso o
 * valor validado entra e volta sem mapper: uma variante nova de um lado quebra o
 * `tsc` na atribuição, que é a decisão que um mapper existiria para forçar
 * (README §2.5).
 */
export function registerSettingsController(settings: SettingsService): void {
  handle(IPC_CHANNELS.themeGet, (): ThemeMode => settings.getThemeMode());

  handle(IPC_CHANNELS.themeSet, (_event, mode: unknown): ThemeMode =>
    settings.setThemeMode(parseOrThrow(themeModeSchema, mode)),
  );
}
