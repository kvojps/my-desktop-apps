import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { DefaultIncome } from '@shared/types/income';
import { Modal } from '@/components/Modal';
import { formatCurrency } from '@/utils/format';
import { DefaultIncomeFormValues, defaultIncomeFormSchema } from './formSchemas';

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
      <TextField
        label="Valor (R$)"
        type="number"
        fullWidth
        error={!!errors.amount}
        helperText={errors.amount?.message ?? 'Deixe em branco para entradas de valor variável.'}
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
      <Controller
        name="bankAccountId"
        control={control}
        render={({ field }) => (
          <TextField select label="Conta (opcional)" fullWidth {...field}>
            <MenuItem value="">
              <em>Nenhuma</em>
            </MenuItem>
            {bankAccounts.map((account) => (
              <MenuItem key={account.id} value={String(account.id)}>
                {account.name} ({formatCurrency(account.balance)})
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </Modal>
  );
}
