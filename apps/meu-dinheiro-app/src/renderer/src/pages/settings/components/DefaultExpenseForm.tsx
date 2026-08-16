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
import { DefaultExpense } from '@shared/types/expense';
import { useCategories } from '@/hooks/categories/useCategories';
import { DefaultExpenseFormValues, defaultExpenseFormSchema } from './formSchemas';

interface DefaultExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    due_day?: number;
    amount: number;
    category_id?: number | null;
  }) => void;
  initial?: DefaultExpense | null;
}

export function DefaultExpenseForm({ open, onClose, onSave, initial }: DefaultExpenseFormProps) {
  const { categories } = useCategories();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DefaultExpenseFormValues>({
    resolver: zodResolver(defaultExpenseFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      amount: initial ? String(initial.amount) : '',
      dueDay: initial?.due_day ? String(initial.due_day) : '',
      categoryId: initial?.category_id ? String(initial.category_id) : '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    onSave({
      name: values.name,
      due_day: values.dueDay ? Number(values.dueDay) : undefined,
      amount: Number(values.amount) || 0,
      category_id: values.categoryId ? Number(values.categoryId) : null,
    });
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Editar Despesa Padrão' : 'Nova Despesa Padrão'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Nome da despesa"
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
          helperText={errors.amount?.message ?? 'Deixe em branco para despesas de valor variável.'}
          sx={{ mb: 2 }}
          {...register('amount')}
        />
        <TextField
          label="Dia de vencimento"
          type="number"
          fullWidth
          error={!!errors.dueDay}
          helperText={errors.dueDay?.message ?? 'Opcional. Dia do mês em que a despesa vence.'}
          inputProps={{ min: 1, max: 31 }}
          sx={{ mb: 2 }}
          {...register('dueDay')}
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
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onSubmit()}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
