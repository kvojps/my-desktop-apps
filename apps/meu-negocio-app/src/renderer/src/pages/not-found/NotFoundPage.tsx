import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';

export function NotFoundPage() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{ minHeight: '60vh', textAlign: 'center' }}
    >
      <Typography variant="h3" color="text.disabled" fontWeight={700}>
        404
      </Typography>
      <Typography variant="h5">Página não encontrada</Typography>
      <Typography variant="body2" color="text.secondary">
        O endereço acessado não existe ou foi movido.
      </Typography>
      <Button component={Link} to={ROUTES.DASHBOARD} variant="contained">
        Voltar para o Dashboard
      </Button>
    </Stack>
  );
}
