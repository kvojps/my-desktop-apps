import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { AppInfo } from '@shared/types/appInfo';
import type { CompanySettings } from '@shared/types/settings';
import type { ThemeMode } from '@shared/types/theme';
import type { SettingsService } from '../services/settingsService';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { companySettingsSchema } from './schemas/settings.schema';
import { themeModeSchema } from './schemas/theme.schema';

/**
 * As preferências do app: os dados da empresa, o modo de tema e a informação de
 * build.
 *
 * `theme:*` e `app:getInfo` moram aqui em vez de num controller de sistema
 * próprio: o plano previa um `systemController`, mas o ticket 05 fechou com
 * quatro services e nenhum `systemService`, e um arquivo com um handler de uma
 * linha contaria uma história que o app não tem. A versão e o caminho do banco
 * são a moldura do app tanto quanto o tema.
 *
 * `CompanySettings` tem mapper de entrada (schema) mas não de saída: o
 * repositório já devolve o tipo de `shared/`, sem entidade própria. `AppInfo`
 * também não tem mapper — não é entidade de domínio, vem do gateway. `ThemeMode`
 * é união de literais e atravessa por atribuição: variante nova quebra o `tsc`
 * na chamada, que é o que um mapper forçaria.
 */
export function registerSettingsController(settings: SettingsService): void {
  handle(IPC_CHANNELS.settingsGet, (): CompanySettings => settings.getSettings());

  handle(IPC_CHANNELS.settingsUpdate, (_event, data: unknown): CompanySettings =>
    settings.updateSettings(parseOrThrow(companySettingsSchema, data)),
  );

  handle(IPC_CHANNELS.appGetInfo, (): AppInfo => settings.getAppInfo());

  handle(IPC_CHANNELS.themeGet, (): ThemeMode => settings.getThemeMode());

  handle(IPC_CHANNELS.themeSet, (_event, mode: unknown): ThemeMode => {
    const value = parseOrThrow(themeModeSchema, mode);
    settings.saveThemeMode(value);
    return value;
  });
}
