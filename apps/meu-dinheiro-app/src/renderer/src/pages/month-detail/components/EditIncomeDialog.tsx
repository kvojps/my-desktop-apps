import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Income } from '@shared/types/income';
import { formatCurrencyBRL } from '@/utils/format';
import { IncomeFormValues, incomeFormSchema } from './formSchemas';

interface EditIncomeDialogProps {
  open: boolean;
  income: Income;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    expected_date?: string;
    notes?: string;
    bank_account_id?: number | null;
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
      expectedDate: income.expected_date || '',
      bankAccountId: income.bank_account_id ? String(income.bank_account_id) : '',
      notes: income.notes || '',
    },
  });

  const submit = handleSubmit(async (values) => {
    const success = await onSubmit({
      name: values.name,
      amount: values.amount ? Number(values.amount) : 0,
      expected_date: values.expectedDate || undefined,
      notes: values.notes || undefined,
      bank_account_id: values.bankAccountId ? Number(values.bankAccountId) : null,
    });
    if (success) onClose();
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Entrada</DialogTitle>
      <DialogContent>
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
                  {account.name} ({formatCurrencyBRL(account.balance)})
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <TextField label="Observação" fullWidth multiline rows={2} {...register('notes')} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => submit()} disabled={isSubmitting}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
