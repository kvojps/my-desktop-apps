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
import { DefaultIncome } from '@shared/types/income';
import { formatCurrencyBRL } from '@/utils/format';
import { DefaultIncomeFormValues, defaultIncomeFormSchema } from './formSchemas';

interface DefaultIncomeFormProps {
  open: boolean;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSave: (data: {
    name: string;
    expected_day?: number;
    amount: number;
    bank_account_id?: number | null;
  }) => void;
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
    formState: { errors },
  } = useForm<DefaultIncomeFormValues>({
    resolver: zodResolver(defaultIncomeFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      amount: initial ? String(initial.amount) : '',
      expectedDay: initial?.expected_day ? String(initial.expected_day) : '',
      bankAccountId: initial?.bank_account_id ? String(initial.bank_account_id) : '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    onSave({
      name: values.name,
      expected_day: values.expectedDay ? Number(values.expectedDay) : undefined,
      amount: Number(values.amount) || 0,
      bank_account_id: values.bankAccountId ? Number(values.bankAccountId) : null,
    });
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Editar Entrada Padrão' : 'Nova Entrada Padrão'}</DialogTitle>
      <DialogContent>
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
          label="Valor (R$) - opcional"
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
                  {account.name} ({formatCurrencyBRL(account.balance)})
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onSubmit()}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
