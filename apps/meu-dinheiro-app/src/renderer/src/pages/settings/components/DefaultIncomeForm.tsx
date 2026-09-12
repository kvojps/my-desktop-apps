import { zodResolver } from '@hookform/resolvers/zod';
import { Button, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { DefaultIncome } from '@shared/types/income';
import { Field, SelectInput } from '@/components/Field';
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
          <Button variant="contained" type="submit" disabled={isSubmitting}>
            Salvar
          </Button>
        </>
      }
    >
      <TextField
        autoFocus
        label="Nome da entrada"
        fullWidth
        error={!!errors.name}
        helperText={errors.name?.message}
        sx={{ mt: 1, mb: 2 }}
        {...register('name')}
      />
      {/* `type="number"` assume `step=1`: sem o step em centavos, um valor
          quebrado vira stepMismatch e o <form> do Modal nem chega a submeter. */}
      <TextField
        label="Valor (R$)"
        type="number"
        fullWidth
        error={!!errors.amount}
        helperText={errors.amount?.message ?? 'Deixe em branco para entradas de valor variável.'}
        slotProps={{ htmlInput: { step: '0.01' } }}
        sx={{ mb: 2 }}
        {...register('amount')}
      />
      <TextField
        label="Dia previsto"
        type="number"
        fullWidth
        error={!!errors.expectedDay}
        helperText={
          errors.expectedDay?.message ?? 'Opcional. Dia do mês em que a entrada é esperada.'
        }
        inputProps={{ min: 1, max: 31 }}
        sx={{ mb: 2 }}
        {...register('expectedDay')}
      />
      {/* Seletor local, e não o do MUI: o `Modal` desta base é um `<dialog>`
          nativo, que ocupa a camada de topo do navegador — a lista do `Select`
          do MUI é desenhada em portal no `body` e ficaria atrás dele. O resto
          deste formulário segue MUI até a issue 05. */}
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
    </Modal>
  );
}
