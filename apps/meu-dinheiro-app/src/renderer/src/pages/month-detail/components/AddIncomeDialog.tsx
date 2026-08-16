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
import { formatCurrencyBRL } from '@/utils/format';
import { IncomeFormValues, incomeFormSchema } from './formSchemas';

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
    expected_date?: string;
    bank_account_id?: number;
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
      expected_date: values.expectedDate || undefined,
      bank_account_id: values.bankAccountId ? Number(values.bankAccountId) : undefined,
    });
    if (success) handleClose();
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nova Entrada</DialogTitle>
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
          helperText={errors.amount?.message}
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
            <TextField select label="Conta (opcional)" fullWidth {...field}>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => submit()} disabled={isSubmitting}>
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
