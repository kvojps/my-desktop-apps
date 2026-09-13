import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Category } from '@shared/types/category';
import { Button } from '@/components/Button';
import { Field, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { CategoryFormValues, categoryFormSchema } from '@/hooks/categories/categorySchema';
import { labelOn } from '@/theme';
import { CATEGORY_SWATCHES } from '@/theme/orca';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => Promise<boolean>;
  initial?: Category | null;
}

const MODE_NAMES = { light: 'claro', dark: 'escuro' } as const;

/**
 * O aviso de um swatch que fica abaixo dos 3:1 de marca em um dos modos.
 * Ele informa a escolha (§1.7) em vez de recusá-la: a cor da categoria é do
 * usuário, e o nome ao lado dela continua sendo quem a identifica.
 */
function contrastNote(color: string): string | null {
  const swatch = CATEGORY_SWATCHES.find((option) => option.color === color);
  if (!swatch?.lowContrast) return null;
  return `Essa cor tem pouco contraste no tema ${MODE_NAMES[swatch.lowContrast]}. O nome ao lado dela continua identificando a categoria.`;
}

export function CategoryForm({ open, onClose, onSave, initial }: CategoryFormProps) {
  const colorLabelId = useId();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      color: initial?.color ?? CATEGORY_SWATCHES[0].color,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const success = await onSave({ name: values.name, color: values.color });
    if (success) onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar Categoria' : 'Nova Categoria'}
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
        <Field label="Nome da categoria" note={errors.name?.message} invalid={!!errors.name}>
          <TextInput aria-invalid={!!errors.name} {...register('name')} />
        </Field>

        {/* A cor vive no react-hook-form como qualquer outro campo. Enquanto ela
            morava num `useState` paralelo, o `color` do schema validava sempre o
            valor inicial e o valor enviado vinha de outro lugar. */}
        <Controller
          name="color"
          control={control}
          render={({ field }) => {
            const aviso = contrastNote(field.value);
            return (
              <div className="money-field">
                <span id={colorLabelId}>Cor</span>
                <div className="money-swatches" role="group" aria-labelledby={colorLabelId}>
                  {CATEGORY_SWATCHES.map((swatch, index) => (
                    <button
                      key={swatch.color}
                      type="button"
                      className="money-swatch"
                      style={{ background: swatch.color, color: labelOn(swatch.color) }}
                      // O hex não diz nada em voz alta; a posição na fileira diz,
                      // e o contraste medido diz o que a escolha custa.
                      aria-label={`Cor ${index + 1} de ${CATEGORY_SWATCHES.length}${
                        swatch.lowContrast
                          ? `, pouco contraste no tema ${MODE_NAMES[swatch.lowContrast]}`
                          : ''
                      }`}
                      aria-pressed={field.value === swatch.color}
                      onClick={() => field.onChange(swatch.color)}
                    >
                      {field.value === swatch.color && <Check size={16} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                {/* A nota só existe para a cor escolhida: dez avisos ao mesmo
                  tempo não informariam escolha nenhuma. */}
                {aviso && <span className="money-field-note">{aviso}</span>}
              </div>
            );
          }}
        />
      </div>
    </Modal>
  );
}
