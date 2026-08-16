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
import { useCategories } from '@/hooks/categories/useCategories';
import { ExpenseFormValues, expenseFormSchema } from './formSchemas';

const emptyValues: ExpenseFormValues = {
  name: '',
  amount: '',
  dueDate: '',
  notes: '',
  categoryId: '',
};

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    due_date?: string;
    category_id?: number | null;
  }) => Promise<boolean>;
}

export function AddExpenseDialog({ open, onClose, onSubmit }: AddExpenseDialogProps) {
  const { categories } = useCategories();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
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
      due_date: values.dueDate || undefined,
      category_id: values.categoryId ? Number(values.categoryId) : null,
    });
    if (success) handleClose();
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nova Despesa</DialogTitle>
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
          label="Data de vencimento"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          {...register('dueDate')}
        />
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <TextField select label="Categoria" fullWidth {...field}>
              <MenuItem value="">
                <em>Sem categoria</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={String(category.id)}>
                  {category.name}
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
