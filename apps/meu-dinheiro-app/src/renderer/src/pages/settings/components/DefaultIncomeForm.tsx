import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { DefaultIncome } from '@shared/types/income';
import { Button } from '@/components/Button';
import { Field, SelectInput, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import {
  DefaultIncomeFormValues,
  defaultIncomeFormSchema,
} from '@/hooks/default-incomes/defaultIncomeSchema';
import { formatCurrency } from '@/utils/format';

interface DefaultIncomeFormProps {
  open: boolean;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSave: (data: {
    name: string;
    expectedDay?: number;
    amount: number;
    bankAccountId?: number | null;
  }) => Promise<boolean>;
  initial?: DefaultIncome | null;
}

export function DefaultIncomeForm({
  open,
  bankAccounts,
  onClose,
  onSave,
  initial,
}: DefaultIncomeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DefaultIncomeFormValues>({
    resolver: zodResolver(defaultIncomeFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      amount: initial ? String(initial.amount) : '',
      expectedDay: initial?.expectedDay ? String(initial.expectedDay) : '',
      bankAccountId: initial?.bankAccountId ? String(initial.bankAccountId) : '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const success = await onSave({
      name: values.name,
      expectedDay: values.expectedDay ? Number(values.expectedDay) : undefined,
      amount: Number(values.amount) || 0,
      bankAccountId: values.bankAccountId ? Number(values.bankAccountId) : null,
    });
    if (success) onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar Entrada Padrão' : 'Nova Entrada Padrão'}
      onSubmit={onSubmit}
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
        <Field label="Nome da entrada" note={errors.name?.message} invalid={!!errors.name}>
          <TextInput aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        {/* `type="number"` assume `step=1`: sem o step em centavos, um valor
            quebrado vira stepMismatch e o <form> do Modal nem chega a submeter. */}
        <Field
          label="Valor (R$)"
          note={errors.amount?.message ?? 'Deixe em branco para entradas de valor variável.'}
          invalid={!!errors.amount}
        >
          <TextInput
            type="number"
            step="0.01"
            aria-invalid={!!errors.amount}
            {...register('amount')}
          />
        </Field>
        <Field
          label="Dia previsto"
          note={errors.expectedDay?.message ?? 'Opcional. Dia do mês em que a entrada é esperada.'}
          invalid={!!errors.expectedDay}
        >
          <TextInput
            type="number"
            min={1}
            max={31}
            aria-invalid={!!errors.expectedDay}
            {...register('expectedDay')}
          />
        </Field>
        <Controller
          name="bankAccountId"
          control={control}
          render={({ field }) => (
            <Field label="Conta (opcional)">
              <SelectInput {...field}>
                <option value="">Nenhuma</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={String(account.id)}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}
        />
      </div>
    </Modal>
  );
}
