import {
  CheckCircle,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert,
  StickyNote2Outlined,
  Visibility,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Income } from '@shared/types/income';
import { formatDateOnlyBR, formatPaidDateBR } from '@/utils/date';
import { formatCurrencyBRLOrFallback } from '@/utils/format';

interface IncomeCardProps {
  income: Income;
  onReceive: () => void;
  onUnreceive: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function IncomeCard({
  income,
  onReceive,
  onUnreceive,
  onViewDetail,
  onEdit,
  onDelete,
}: IncomeCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const borderColor = income.is_received ? 'success.main' : 'warning.main';

  function closeMenu() {
    setMenuAnchor(null);
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '4px solid',
        borderLeftColor: borderColor,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="h6" gutterBottom>
              {income.name}
            </Typography>
            {income.notes && (
              <Tooltip title="Possui observação">
                <StickyNote2Outlined fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {income.is_received ? (
              <Chip label="Recebida" color="success" size="small" icon={<CheckCircle />} />
            ) : (
              <Chip label="Pendente" color="warning" size="small" />
            )}
          </Stack>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          {formatCurrencyBRLOrFallback(income.amount)}
        </Typography>
        {income.expected_date && (
          <Typography variant="body2" color="text.secondary">
            Previsto: {formatDateOnlyBR(income.expected_date)}
          </Typography>
        )}
        {income.received_at && (
          <Typography variant="body2" color="text.secondary">
            Recebido em: {formatPaidDateBR(income.received_at)}
          </Typography>
        )}
        {income.bank_account_name && (
          <Typography variant="body2" color="text.secondary">
            {income.is_received ? 'Conta' : 'Conta prevista'}: {income.bank_account_name}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        {income.is_received ? (
          <Button size="small" color="warning" onClick={onUnreceive}>
            Desmarcar
          </Button>
        ) : (
          <Button size="small" variant="contained" color="success" onClick={onReceive}>
            Receber
          </Button>
        )}
        <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
          <MoreVert fontSize="small" />
        </IconButton>
        <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              closeMenu();
              onViewDetail();
            }}
          >
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver detalhes</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              onEdit();
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              onDelete();
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        </Menu>
      </CardActions>
    </Card>
  );
}
