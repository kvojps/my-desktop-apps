import { shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { AppError } from '../errors/AppError';

const ALLOWED = /jpeg|jpg|png|gif|pdf/;
const MAX_SIZE = 10 * 1024 * 1024;

export function saveReceiptFile(
  uploadsDir: string,
  monthLabel: string,
  expenseName: string,
  expenseId: number,
  originalName: string,
  mimeType: string,
  buffer: Buffer,
): string {
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
  // O id garante unicidade: duas despesas com mesmo nome no mesmo mês não devem
  // sobrescrever o comprovante uma da outra.
  const filename = `${monthPart}-${namePart}-${expenseId}${ext}`;

  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return filename;
}

export function deleteReceiptFile(uploadsDir: string, receipt: string | null) {
  if (!receipt) return;
  const filePath = path.join(uploadsDir, receipt);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Erro ao excluir comprovante:', err);
    }
  });
}

export async function openReceiptFile(uploadsDir: string, receipt: string): Promise<void> {
  const result = await shell.openPath(path.join(uploadsDir, receipt));
  if (result) {
    throw new AppError(500, result);
  }
}
