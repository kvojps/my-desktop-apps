import type { EncryptedGithubTokenEntity, ThemeModeEntity } from '../domain/settings';
import type { Repositories } from '../infra/database';
import type { SecretVaultGateway } from '../infra/gateways/system/safeStorage';
import type { ThemeGateway } from '../infra/gateways/system/theme';
import { AppError } from '../utils/errors/AppError';

/**
 * As preferências do app: o tema e o token do GitHub.
 *
 * Os dois gateways chegam por parâmetro, e não por import, porque os dois são
 * Electron — o service que os importasse direto conheceria Electron por
 * transitividade, que é exatamente o que a camada existe para impedir. Os
 * gateways de `git/` e `pr/` continuam sendo importados: são Node puro e já
 * recebem tudo por parâmetro.
 */
export function makeSettingsService(
  repos: Repositories,
  vault: SecretVaultGateway,
  theme: ThemeGateway,
) {
  return {
    /** Persiste e aplica: a janela e a moldura nativa acompanham a escolha. */
    saveThemeMode(mode: ThemeModeEntity): void {
      repos.settings.saveThemeMode(mode);
      theme.apply(mode);
    },

    /**
     * Salvar em texto puro seria pior do que não salvar: o arquivo do banco fica
     * num diretório comum do usuário. Sem cofre, a operação falha e diz por quê.
     */
    saveGithubToken(token: string): void {
      if (!vault.isAvailable()) {
        throw new AppError(
          500,
          'O cofre de credenciais do sistema não está disponível; o token não pode ser salvo com segurança.',
        );
      }

      const encrypted: EncryptedGithubTokenEntity = vault.encrypt(token);
      repos.settings.saveGithubToken(encrypted);
    },

    /**
     * `null` quando não há token, quando o cofre sumiu ou quando o que está
     * guardado não decifra mais — as três respostas valem o mesmo para quem
     * chama: não há credencial utilizável nesta máquina.
     */
    getGithubToken(): string | null {
      const stored = repos.settings.getGithubToken();
      if (!stored) return null;
      if (!vault.isAvailable()) return null;
      return vault.decrypt(stored);
    },

    /** Se existe token gravado — não se ele ainda decifra. */
    hasGithubToken(): boolean {
      return repos.settings.hasGithubToken();
    },

    deleteGithubToken(): void {
      repos.settings.deleteGithubToken();
    },
  };
}

export type SettingsService = ReturnType<typeof makeSettingsService>;
