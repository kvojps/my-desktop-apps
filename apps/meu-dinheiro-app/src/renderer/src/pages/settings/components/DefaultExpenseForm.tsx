import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { DefaultExpense } from '@shared/types/expense';
import { CategoryTag } from '@/components/CategoryTag';
import { Modal } from '@/components/Modal';
import { useCategories } from '@/hooks/categories/useCategories';
import { DefaultExpenseFormValues, defaultExpenseFormSchema } from './formSchemas';

interface DefaultExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    dueDay?: number;
    amount: number;
    categoryId?: number | null;
  }) => Promise<boolean>;
  initial?: DefaultExpense | null;
}

export function DefaultExpenseForm({ open, onClose, onSave, initial }: DefaultExpenseFormProps) {
  const { categories } = useCategories();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DefaultExpenseFormValues>({
    resolver: zodResolver(defaultExpenseFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      amount: initial ? String(initial.amount) : '',
      dueDay: initial?.dueDay ? String(initial.dueDay) : '',
      categoryId: initial?.categoryId ? String(initial.categoryId) : '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const success = await onSave({
      name: values.name,
      dueDay: values.dueDay ? Number(values.dueDay) : undefined,
      amount: Number(values.amount) || 0,
      categoryId: values.categoryId ? Number(values.categoryId) : null,
    });
    if (success) onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar Despesa Padrão' : 'Nova Despesa Padrão'}
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
        label="Nome da despesa"
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
                <CategoryTag name={category.name} color={category.color} />
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </Modal>
  );
}
