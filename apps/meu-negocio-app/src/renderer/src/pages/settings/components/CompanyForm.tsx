import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import type { UseSettingsReturn } from '@/hooks/settings/useSettings';

interface CompanyFormProps {
  formState: UseSettingsReturn;
}

export function CompanyForm({ formState }: CompanyFormProps) {
  const { form, isLoading, isSaving, onSubmit } = formState;
  const {
    register,
    formState: { errors, isDirty },
  } = form;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Dados da Empresa
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Usados como cabeçalho dos documentos gerados pelo app e incluídos no arquivo de backup.
        </Typography>

        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Nome da empresa"
              required
              error={!!errors.name}
              helperText={errors.name?.message}
              placeholder="Ex: Ateliê da Ana"
              disabled={isLoading}
              fullWidth
              {...register('name')}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="CNPJ ou CPF"
                error={!!errors.cnpj}
                helperText={errors.cnpj?.message}
                placeholder="00.000.000/0000-00"
                disabled={isLoading}
                fullWidth
                {...register('cnpj')}
              />

              <TextField
                label="Telefone"
                error={!!errors.phone}
                helperText={errors.phone?.message}
                placeholder="(11) 91234-5678"
                disabled={isLoading}
                fullWidth
                {...register('phone')}
              />
            </Stack>

            <TextField
              label="Endereço"
              error={!!errors.address}
              helperText={errors.address?.message}
              placeholder="Rua, número, bairro, cidade e estado"
              multiline
              rows={2}
              disabled={isLoading}
              fullWidth
              {...register('address')}
            />

            <Stack direction="row" justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || isSaving || !isDirty}
              >
                {isSaving ? 'Salvando…' : 'Salvar'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
