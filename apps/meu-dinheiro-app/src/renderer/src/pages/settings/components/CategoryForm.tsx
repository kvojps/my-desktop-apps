import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Category } from '@shared/types/category';
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
      <DialogContent>
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
            <Box
              key={swatch}
              onClick={() => setColor(swatch)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: swatch,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid',
                borderColor: color === swatch ? 'text.primary' : 'transparent',
              }}
            >
              {color === swatch && <Check fontSize="small" sx={{ color: '#fff' }} />}
            </Box>
          ))}
        </Box>
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
