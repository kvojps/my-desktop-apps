import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { BankAccountField } from '@/components/BankAccountField';
import { Button } from '@/components/Button';
import { Field, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { IncomeFormValues, incomeFormSchema } from '@/pages/month-detail/hooks/incomeSchema';

const emptyValues: IncomeFormValues = {
  name: '',
  amount: '',
  expectedDate: '',
  bankAccountId: '',
  notes: '',
};

interface AddIncomeDialogProps {
  open: boolean;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    expectedDate?: string;
    bankAccountId?: number;
  }) => Promise<boolean>;
}

export function AddIncomeDialog({ open, bankAccounts, onClose, onSubmit }: AddIncomeDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: emptyValues,
  });

  function handleClose() {
    reset(emptyValues);
    onClose();
  }

  const submit = handleSubmit(async (values) => {
    const success = await onSubmit({
      name: values.name,
      amount: Number(values.amount) || 0,
      expectedDate: values.expectedDate || undefined,
      bankAccountId: values.bankAccountId ? Number(values.bankAccountId) : undefined,
    });
    if (success) handleClose();
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nova Entrada"
      onSubmit={submit}
      footer={
        <>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adicionando...' : 'Adicionar'}
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
        <Field label="Valor (R$)" note={errors.amount?.message} invalid={!!errors.amount}>
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
      </div>
    </Modal>
  );
}
