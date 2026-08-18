import { AccountBalance, Label, ReceiptLong, Settings } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';

const STEPS = [
  {
    icon: <AccountBalance fontSize="small" />,
    title: 'Cadastre suas contas',
    description: 'É de onde saem os pagamentos e para onde entram os recebimentos.',
  },
  {
    icon: <Label fontSize="small" />,
    title: 'Ajuste as categorias',
    description: 'Dez já vêm prontas; renomeie ou troque a cor das que você usa.',
  },
  {
    icon: <ReceiptLong fontSize="small" />,
    title: 'Cadastre as despesas e entradas fixas',
    description: 'Elas são criadas automaticamente em todo mês novo.',
  },
];

interface FirstRunGuideProps {
  onGoToSettings: () => void;
}

export function FirstRunGuide({ onGoToSettings }: FirstRunGuideProps) {
  return (
    <Card variant="outlined" sx={{ mt: 6, mx: 'auto', maxWidth: 620 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Nenhum mês cadastrado
        </Typography>
        <Typography color="text.secondary">
          Três passos em Configurações e o app já monta os meses para você.
        </Typography>

        <List sx={{ my: 1 }}>
          {STEPS.map((step, index) => (
            <ListItem key={step.title} disableGutters alignItems="flex-start">
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>{step.icon}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${index + 1}. ${step.title}`}
                secondary={step.description}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" startIcon={<Settings />} onClick={onGoToSettings}>
            Ir para Configurações
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
