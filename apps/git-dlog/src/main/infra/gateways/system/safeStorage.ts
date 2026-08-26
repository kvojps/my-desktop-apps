import { safeStorage } from 'electron';

/**
 * O cofre de credenciais do sistema operacional (DPAPI no Windows, Keychain no
 * macOS), atrás de uma interface que não fala Electron.
 *
 * A cifragem morava dentro do `settingsRepository`, que assim virava um
 * repositório fazendo criptografia — e, pior, um repositório que importava
 * Electron. Aqui ela é o que sempre foi: mundo externo, chamado pelo service
 * (README §2.2).
 *
 * O gateway não decide nada. Ele responde se o cofre está disponível e devolve
 * `null` quando a decifragem falha; o que fazer com cada resposta é do
 * `settingsService`.
 */
export interface SecretVaultGateway {
  /** Falso quando o SO não oferece cofre (sessão sem chaveiro, por exemplo). */
  isAvailable(): boolean;
  /** Cifra e codifica em base64 — a forma que o banco guarda. */
  encrypt(plain: string): string;
  /** `null` quando o valor guardado não decifra com o cofre atual. */
  decrypt(encoded: string): string | null;
}

export const safeStorageVault: SecretVaultGateway = {
  isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  },

  encrypt(plain: string): string {
    return safeStorage.encryptString(plain).toString('base64');
  },

  decrypt(encoded: string): string | null {
    try {
      return safeStorage.decryptString(Buffer.from(encoded, 'base64'));
    } catch {
      // Cofre do SO trocado (outro usuário, outra máquina, perfil recriado):
      // o valor guardado virou lixo indecifrável.
      return null;
    }
  },
};
