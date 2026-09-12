import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Income } from '@shared/types/income';
import { BankAccountField } from '@/components/BankAccountField';
import { Button } from '@/components/Button';
import { Field, TextArea, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { ReceiveFormValues, receiveFormSchema } from '@/pages/month-detail/hooks/incomeSchema';
import { formatDateOnly, todayDateString } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';

interface ReceiveDialogProps {
  open: boolean;
  income: Income | null;
  bankAccounts: BankAccount[];
  onClose: () => void;
  /** Devolve se o recebimento foi gravado: é o que decide limpar ou preservar. */
  onConfirm: (notes?: string, receivedAt?: string, bankAccountId?: number) => Promise<boolean>;
}

export function ReceiveDialog({
  open,
  income,
  bankAccounts,
  onClose,
  onConfirm,
}: ReceiveDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveFormSchema),
    defaultValues: { receivedAt: todayDateString(), bankAccountId: '', notes: '' },
  });

  // A conta prevista da entrada chega sugerida: quem cadastrou "salário na
  // conta corrente" não precisa dizer de novo onde ele caiu.
  useEffect(() => {
    if (open) {
      reset({
        receivedAt: todayDateString(),
        bankAccountId: income?.bankAccountId ? String(income.bankAccountId) : '',
        notes: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, income?.id]);

  function handleClose() {
    reset({ receivedAt: todayDateString(), bankAccountId: '', notes: '' });
    onClose();
  }

  // Só limpa quando gravou — uma recusa recuperável devolve o formulário como
  // ele estava, e não em branco.
  const submit = handleSubmit(async (values) => {
    const saved = await onConfirm(
      values.notes || undefined,
      values.receivedAt || undefined,
      values.bankAccountId ? Number(values.bankAccountId) : undefined,
    );
    if (saved) {
      reset({ receivedAt: todayDateString(), bankAccountId: '', notes: '' });
    }
  });

  if (!income) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Receber Entrada"
      onSubmit={submit}
      footer={
        <>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Confirmando...' : 'Confirmar Recebimento'}
          </Button>
        </>
      }
    >
      <div className="money-form">
        <div className="money-dialog-summary">
          <strong>{income.name}</strong>
          <span>
            Valor: {formatCurrencyOrFallback(income.amount)}
            {income.expectedDate && ` · Previsto: ${formatDateOnly(income.expectedDate)}`}
          </span>
        </div>

        <Field label="Data do recebimento">
          <TextInput type="date" max={todayDateString()} {...register('receivedAt')} />
        </Field>

        <Controller
          name="bankAccountId"
          control={control}
          render={({ field }) => <BankAccountField accounts={bankAccounts} {...field} />}
        />

        <Field label="Observações">
          <TextArea {...register('notes')} />
        </Field>
      </div>
    </Modal>
  );
}
