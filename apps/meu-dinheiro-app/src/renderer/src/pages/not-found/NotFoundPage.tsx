import { ErrorOutline } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: 'center', mt: 8 }}>
      <ErrorOutline sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
      <Typography variant="h5" gutterBottom>
        Página não encontrada
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        O endereço acessado não existe.
      </Typography>
      <Button variant="contained" onClick={() => navigate(ROUTES.DASHBOARD)}>
        Voltar para a Visão Geral
      </Button>
    </Box>
  );
}
