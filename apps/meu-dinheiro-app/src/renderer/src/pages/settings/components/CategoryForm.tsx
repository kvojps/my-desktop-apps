import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from '@mui/icons-material';
import { Box, Button, ButtonBase, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Category } from '@shared/types/category';
import { Modal } from '@/components/Modal';
import { CategoryFormValues, categoryFormSchema } from './formSchemas';

export const CATEGORY_COLORS = [
  '#5C6BC0',
  '#FB8C00',
  '#1E88E5',
  '#E53935',
  '#7B1FA2',
  '#43A047',
  '#00ACC1',
  '#D81B60',
  '#B85C38',
  '#757575',
];

/**
 * As cores são escolhidas pelo usuário, então o check não pode ser branco fixo:
 * sobre as amostras claras da paleta ele sumia. Decide pela luminância relativa
 * da própria amostra, que é a mesma conta do `contrastText` do tema.
 */
function checkColorOn(hex: string): string {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.4 ? 'rgba(0, 0, 0, 0.87)' : '#fff';
}

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => void;
  initial?: Category | null;
}

export function CategoryForm({ open, onClose, onSave, initial }: CategoryFormProps) {
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      color: initial?.color ?? CATEGORY_COLORS[0],
    },
  });

  const onSubmit = handleSubmit((values) => {
    onSave({ name: values.name, color });
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
          <Button variant="contained" type="submit">
            Salvar
          </Button>
        </>
      }
    >
      <TextField
        autoFocus
        label="Nome da categoria"
        fullWidth
        error={!!errors.name}
        helperText={errors.name?.message}
        sx={{ mt: 1, mb: 2 }}
        {...register('name')}
      />
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Cor
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {CATEGORY_COLORS.map((swatch) => (
          <ButtonBase
            key={swatch}
            onClick={() => setColor(swatch)}
            aria-label={`Cor ${swatch}`}
            aria-pressed={color === swatch}
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: swatch,
              border: '2px solid',
              borderColor: color === swatch ? 'text.primary' : 'transparent',
            }}
          >
            {color === swatch && <Check fontSize="small" sx={{ color: checkColorOn(swatch) }} />}
          </ButtonBase>
        ))}
      </Box>
    </Modal>
  );
}
