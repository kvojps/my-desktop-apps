import { shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { AppError } from '../../utils/errors/AppError';

const ALLOWED = /jpeg|jpg|png|gif|pdf/;
const MAX_SIZE = 10 * 1024 * 1024;

export interface SaveReceiptInput {
  monthLabel: string;
  expenseName: string;
  expenseId: number;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}

/**
 * O comprovante visto como recurso de disco: gravar o arquivo na hora do
 * pagamento, apagá-lo ao desmarcar/excluir a despesa, e abri-lo no visualizador
 * do SO. Vive no topo de `gateways/` (não sob `system/`) porque é um recurso do
 * domínio de despesas, não do sistema operacional (spec desta pasta, decisão 10).
 *
 * O `uploadsDir` chega fechado na composição (`registerIpc`), então o
 * `expensesService` não precisa carregá-lo — deriva de um path puro em
 * `infra/database/connection.ts` (decisão 13).
 */
export interface ReceiptsGateway {
  /** Grava e devolve o nome do arquivo. `AppError(400)` para tipo ou tamanho inválido. */
  save(input: SaveReceiptInput): string;
  /** Apaga o arquivo, se houver. Silencioso quando o arquivo já sumiu. */
  delete(filename: string | null): void;
  /** Abre no visualizador do SO. `AppError(500)` se o SO recusar. */
  open(filename: string): Promise<void>;
}

export function makeReceiptsGateway(uploadsDir: string): ReceiptsGateway {
  return {
    save({ monthLabel, expenseName, expenseId, originalName, mimeType, buffer }: SaveReceiptInput) {
      const ext = path.extname(originalName).toLowerCase();
      const extOk = ALLOWED.test(ext);
      const mimeOk = ALLOWED.test(mimeType);
      if (!extOk && !mimeOk) {
        throw new AppError(400, 'Only image files and PDFs are allowed');
      }
      if (buffer.byteLength > MAX_SIZE) {
        throw new AppError(400, 'Arquivo excede o limite de 10MB');
      }

      const monthPart = (monthLabel || 'unknown').replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
      const namePart = (expenseName || 'unknown').replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
      // O id garante unicidade: duas despesas com mesmo nome no mesmo mês não
      // devem sobrescrever o comprovante uma da outra.
      const filename = `${monthPart}-${namePart}-${expenseId}${ext}`;

      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);
      return filename;
    },

    delete(filename: string | null) {
      if (!filename) return;
      const filePath = path.join(uploadsDir, filename);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Erro ao excluir comprovante:', err);
        }
      });
    },

    async open(filename: string) {
      const result = await shell.openPath(path.join(uploadsDir, filename));
      if (result) {
        throw new AppError(500, result);
      }
    },
  };
}
