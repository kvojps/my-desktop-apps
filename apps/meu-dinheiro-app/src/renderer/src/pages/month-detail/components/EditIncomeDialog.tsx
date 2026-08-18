import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Income } from '@shared/types/income';
import { Modal } from '@/components/Modal';
import { formatCurrency } from '@/utils/format';
import { IncomeFormValues, incomeFormSchema } from './formSchemas';

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
          <Button variant="contained" type="submit" disabled={isSubmitting}>
            Salvar
          </Button>
        </>
      }
    >
      <TextField
        autoFocus
        label="Nome"
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
        helperText={errors.amount?.message ?? 'Deixe em branco para valor variável.'}
        sx={{ mb: 2 }}
        {...register('amount')}
      />
      <TextField
        label="Data prevista"
        type="date"
        fullWidth
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
        {...register('expectedDate')}
      />
      <Controller
        name="bankAccountId"
        control={control}
        render={({ field }) => (
          <TextField select label="Conta (opcional)" fullWidth sx={{ mb: 2 }} {...field}>
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
      <TextField label="Observação" fullWidth multiline rows={2} {...register('notes')} />
    </Modal>
  );
}
