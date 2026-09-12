import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Income } from '@shared/types/income';
import type { IncomesService } from '../services/incomesService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import {
  createIncomeSchema,
  receiveIncomeSchema,
  updateIncomeSchema,
} from './schemas/incomes.schema';

/**
 * As Entradas de um Mês e o crédito/estorno da Conta ao marcá-las recebidas. O
 * fluxo é todo do `incomesService`; aqui ficam só `parseOrThrow` / `parseId` na
 * entrada. `Income` (`@shared/types/income`) atravessa direto — sem mapper de
 * saída (ADR-0005).
 */
export function registerIncomesController(incomes: IncomesService): void {
  handle(IPC_CHANNELS.incomesListForMonth, (_event, monthId: unknown): Income[] =>
    incomes.listForMonth(parseId(monthId)),
  );

  handle(IPC_CHANNELS.incomesCreate, (_event, monthId: unknown, data: unknown): Income =>
    incomes.create(parseId(monthId), parseOrThrow(createIncomeSchema, data)),
  );

  handle(IPC_CHANNELS.incomesUpdate, (_event, id: unknown, data: unknown): Income =>
    incomes.update(parseId(id), parseOrThrow(updateIncomeSchema, data)),
  );

  handle(IPC_CHANNELS.incomesDelete, (_event, id: unknown): { message: string } => {
    incomes.delete(parseId(id));
    return { message: 'Income deleted' };
  });

  handle(
    IPC_CHANNELS.incomesReceive,
    (_event, id: unknown, notes: unknown, receivedAt: unknown, bankAccountId: unknown): Income => {
      const body = parseOrThrow(receiveIncomeSchema, { notes, receivedAt, bankAccountId });
      return incomes.receive(parseId(id), {
        notes: body.notes ?? undefined,
        receivedAt: body.receivedAt,
        bankAccountId: body.bankAccountId,
      });
    },
  );

  handle(IPC_CHANNELS.incomesUnreceive, (_event, id: unknown): Income =>
    incomes.unreceive(parseId(id)),
  );
}
