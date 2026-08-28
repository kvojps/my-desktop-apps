import { ZipArchive } from 'archiver';
import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';

/**
 * O `.zip` do backup visto como dependência: empacotar (`data.json` +
 * `uploads/`) e desempacotar. Fica no topo de `gateways/` (como `receipts.ts`,
 * decisão 10) e não sob `system/`, porque não é um recurso do SO — é o formato
 * de arquivo do próprio backup (spec desta pasta, decisão 12).
 *
 * O `backupService` orquestra a ordem em volta: extrair → validar → gravar no
 * banco → só então copiar os comprovantes, e sempre limpar o diretório
 * temporário.
 */
export interface BackupArchiveGateway {
  /** Grava `data.json` e a pasta `uploads/` (se existir) num `.zip` em `filePath`. */
  write(filePath: string, dataJson: string, uploadsDir: string): Promise<void>;
  /** Extrai o `.zip` num diretório temporário e devolve o conteúdo cru de `data.json`. */
  extract(filePath: string): Promise<ExtractedArchive>;
}

export interface ExtractedArchive {
  /** `data.json` já desserializado (ou `null` se ausente/ilegível) — para o `parseBackupData`. */
  data: unknown;
  /** Copia o `uploads/` do arquivo para a pasta viva. Chamar só após o import do banco confirmar. */
  restoreUploads(uploadsDir: string): void;
  /** Remove o diretório temporário. Sempre num `finally`. */
  cleanup(): void;
}

export const backupArchive: BackupArchiveGateway = {
  write(filePath: string, dataJson: string, uploadsDir: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(filePath);
      const archive = new ZipArchive({ zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err: Error) => reject(err));
      archive.pipe(output);

      archive.append(dataJson, { name: 'data.json' });
      if (fs.existsSync(uploadsDir)) {
        archive.directory(uploadsDir, 'uploads');
      }

      archive.finalize();
    });
  },

  async extract(filePath: string): Promise<ExtractedArchive> {
    const tempDir = path.join(app.getPath('temp'), 'meu-dinheiro-import-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      const directory = await unzipper.Open.file(filePath);
      await directory.extract({ path: tempDir });
    } catch (err) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      throw err;
    }

    let data: unknown = null;
    const dataPath = path.join(tempDir, 'data.json');
    if (fs.existsSync(dataPath)) {
      try {
        data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      } catch {
        data = null;
      }
    }

    return {
      data,

      restoreUploads(uploadsDir: string): void {
        const source = path.join(tempDir, 'uploads');
        if (!fs.existsSync(source)) return;
        fs.mkdirSync(uploadsDir, { recursive: true });
        for (const file of fs.readdirSync(source)) {
          fs.copyFileSync(path.join(source, file), path.join(uploadsDir, file));
        }
      },

      cleanup(): void {
        fs.rmSync(tempDir, { recursive: true, force: true });
      },
    };
  },
};
