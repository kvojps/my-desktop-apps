import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { DefaultExpense } from '@shared/types/expense';
import { Button } from '@/components/Button';
import { Field, SelectInput, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { useCategories } from '@/hooks/categories/useCategories';
import {
  DefaultExpenseFormValues,
  defaultExpenseFormSchema,
} from '@/hooks/default-expenses/defaultExpenseSchema';

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
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </>
      }
    >
      <div className="money-form">
        <Field label="Nome da despesa" note={errors.name?.message} invalid={!!errors.name}>
          <TextInput aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        {/* `type="number"` assume `step=1`: sem o step em centavos, um valor
            quebrado vira stepMismatch e o <form> do Modal nem chega a submeter. */}
        <Field
          label="Valor (R$)"
          note={errors.amount?.message ?? 'Deixe em branco para despesas de valor variável.'}
          invalid={!!errors.amount}
        >
          <TextInput
            type="number"
            step="0.01"
            aria-invalid={!!errors.amount}
            {...register('amount')}
          />
        </Field>
        <Field
          label="Dia de vencimento"
          note={errors.dueDay?.message ?? 'Opcional. Dia do mês em que a despesa vence.'}
          invalid={!!errors.dueDay}
        >
          <TextInput
            type="number"
            min={1}
            max={31}
            aria-invalid={!!errors.dueDay}
            {...register('dueDay')}
          />
        </Field>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Field label="Categoria">
              <SelectInput {...field}>
                <option value="">Sem categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}
        />
      </div>
    </Modal>
  );
}
