import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Income } from '@shared/types/income';
import { BankAccountField } from '@/components/BankAccountField';
import { Button } from '@/components/Button';
import { Field, TextArea, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { IncomeFormValues, incomeFormSchema } from '@/pages/month-detail/hooks/incomeSchema';

interface EditIncomeDialogProps {
  open: boolean;
  income: Income;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    expectedDate?: string;
    notes?: string;
    bankAccountId?: number | null;
  }) => Promise<boolean>;
}

export function EditIncomeDialog({
  open,
  income,
  bankAccounts,
  onClose,
  onSubmit,
}: EditIncomeDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      name: income.name,
      amount: income.amount ? String(income.amount) : '',
      expectedDate: income.expectedDate || '',
      bankAccountId: income.bankAccountId ? String(income.bankAccountId) : '',
      notes: income.notes || '',
    },
  });

  const submit = handleSubmit(async (values) => {
    const success = await onSubmit({
      name: values.name,
      amount: values.amount ? Number(values.amount) : 0,
      expectedDate: values.expectedDate || undefined,
      notes: values.notes || undefined,
      bankAccountId: values.bankAccountId ? Number(values.bankAccountId) : null,
    });
    if (success) onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar Entrada"
      onSubmit={submit}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </>
      }
    >
      <div className="money-form">
        <Field label="Nome" note={errors.name?.message} invalid={!!errors.name}>
          <TextInput aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        {/* `type="number"` assume `step=1`: sem o step em centavos, um valor
            quebrado vira stepMismatch e o <form> do Modal nem chega a submeter. */}
        <Field
          label="Valor (R$)"
          note={errors.amount?.message ?? 'Deixe em branco para valor variável.'}
          invalid={!!errors.amount}
        >
          <TextInput
            type="number"
            step="0.01"
            aria-invalid={!!errors.amount}
            {...register('amount')}
          />
        </Field>
        <Field label="Data prevista">
          <TextInput type="date" {...register('expectedDate')} />
        </Field>
        <Controller
          name="bankAccountId"
          control={control}
          render={({ field }) => <BankAccountField accounts={bankAccounts} {...field} />}
        />
        <Field label="Observação">
          <TextArea rows={2} {...register('notes')} />
        </Field>
      </div>
    </Modal>
  );
}
