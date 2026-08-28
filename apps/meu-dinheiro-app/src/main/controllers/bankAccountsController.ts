import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { BankAccount } from '@shared/types/bank-account';
import type { BankAccountsService } from '../services/bankAccountsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { bankAccountToResponse } from './responses/bankAccount.response';
import { createBankAccountSchema, updateBankAccountSchema } from './schemas/bankAccounts.schema';

/**
 * As Contas bancárias e o saldo. A regra "não dá para debitar mais do que tem" e
 * a transação de exclusão (zera as referências, depois apaga) são do
 * `bankAccountsService`; aqui ficam `parseOrThrow` / `parseId` na entrada e
 * `bankAccountToResponse` na saída.
 */
export function registerBankAccountsController(bankAccounts: BankAccountsService): void {
  handle(IPC_CHANNELS.bankAccountsList, (): BankAccount[] =>
    bankAccounts.list().map(bankAccountToResponse),
  );

  handle(IPC_CHANNELS.bankAccountsCreate, (_event, data: unknown): BankAccount =>
    bankAccountToResponse(bankAccounts.create(parseOrThrow(createBankAccountSchema, data))),
  );

  handle(IPC_CHANNELS.bankAccountsUpdate, (_event, id: unknown, data: unknown): BankAccount =>
    bankAccountToResponse(
      bankAccounts.update(parseId(id), parseOrThrow(updateBankAccountSchema, data)),
    ),
  );

  handle(IPC_CHANNELS.bankAccountsDelete, (_event, id: unknown): { message: string } => {
    bankAccounts.delete(parseId(id));
    return { message: 'Bank account deleted' };
  });
}
