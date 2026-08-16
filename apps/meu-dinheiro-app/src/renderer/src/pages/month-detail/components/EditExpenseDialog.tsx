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
import { Expense } from '@shared/types/expense';
import { useCategories } from '@/hooks/categories/useCategories';
import { ExpenseFormValues, expenseFormSchema } from './formSchemas';

interface EditExpenseDialogProps {
  open: boolean;
  expense: Expense;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    due_date?: string;
    notes?: string;
    category_id?: number | null;
  }) => Promise<boolean>;
}

export function EditExpenseDialog({ open, expense, onClose, onSubmit }: EditExpenseDialogProps) {
  const { categories } = useCategories();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: expense.name,
      amount: expense.amount ? String(expense.amount) : '',
      dueDate: expense.due_date || '',
      notes: expense.notes || '',
      categoryId: expense.category_id ? String(expense.category_id) : '',
    },
  });

  const submit = handleSubmit(async (values) => {
    const success = await onSubmit({
      name: values.name,
      amount: values.amount ? Number(values.amount) : 0,
      due_date: values.dueDate || undefined,
      notes: values.notes || undefined,
      category_id: values.categoryId ? Number(values.categoryId) : null,
    });
    if (success) onClose();
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Despesa</DialogTitle>
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
            <TextField select label="Categoria" fullWidth sx={{ mb: 2 }} {...field}>
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
